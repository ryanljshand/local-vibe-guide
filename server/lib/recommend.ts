// Orchestration: turn a location into mood "situations" and, per mood, a set of
// real events (the hero) each paired with nearby venues (the sidekick), written
// up in the user's generation voice.
//
// Flow:
//   ingest events  →  derive moods from what's actually on  →  allocate events
//   across moods (no event repeats across moods)  →  per chosen mood: pair venues
//   + LLM writes copy.

import type { Activity, EventItem, GeoContext, Mood } from './types';
import { ingestEvents } from './sources';
import { deriveMoodsFromEvents, eventMoodFit, eventScore } from './events';
import { greedyAllocate, type Candidate } from './allocate';
import { pairVenuesForEvent } from './places';
import { writeActivities, type EventWithPairings } from './llm';

export interface Plan {
  context: GeoContext;
  moods: Mood[];
  sourcesUsed: string[];
  mockOnly: boolean;
  /** moodId → the events allocated to it (deduped across moods). */
  allocation: Map<string, EventItem[]>;
}

const PER_MOOD = 6;

// Short-lived plan cache so picking different moods reuses one ingest pass.
const planCache = new Map<string, { plan: Plan; ts: number }>();
const PLAN_TTL = 25 * 60 * 1000;

function planKey(ctx: GeoContext): string {
  return `${ctx.location}::${ctx.localDate}`;
}

/** Allocate events to their moods with the no-repeat guarantee + per-mood cap. */
function allocateEvents(moods: Mood[], events: EventItem[]): Map<string, EventItem[]> {
  const candidates: Candidate<EventItem>[] = [];
  for (const mood of moods) {
    for (const ev of events) {
      const fit = eventMoodFit(mood.kind, ev);
      if (fit <= 0) continue;
      candidates.push({ moodId: mood.id, key: ev.id, fit, score: eventScore(ev), item: ev });
    }
  }
  const allocated = greedyAllocate(moods.map((m) => m.id), candidates, { perMood: PER_MOOD });
  const out = new Map<string, EventItem[]>();
  for (const [moodId, list] of allocated) out.set(moodId, list.map((c) => c.item));
  return out;
}

export async function buildPlan(ctx: GeoContext): Promise<Plan> {
  const key = planKey(ctx);
  const cached = planCache.get(key);
  if (cached && Date.now() - cached.ts < PLAN_TTL) return cached.plan;

  const nowIso = `${ctx.localDate}T${String(ctx.localHour).padStart(2, '0')}:00:00`;
  const { events, sourcesUsed, mockOnly } = await ingestEvents({
    lat: ctx.lat,
    lng: ctx.lng,
    city: ctx.city,
    localDate: ctx.localDate,
    nowIso,
    neighborhoods: ctx.neighborhood ? [ctx.neighborhood] : undefined,
  });

  const moods = deriveMoodsFromEvents(events);
  const allocation = allocateEvents(moods, events);

  const plan: Plan = { context: ctx, moods, sourcesUsed, mockOnly, allocation };
  planCache.set(key, { plan, ts: Date.now() });
  return plan;
}

export interface MoodRecommendation {
  summary: string;
  activities: Activity[];
}

export async function recommendForMood(
  ctx: GeoContext,
  moodId: string,
  generation: string,
): Promise<MoodRecommendation> {
  const plan = await buildPlan(ctx);
  const mood = plan.moods.find((m) => m.id === moodId);
  const events = plan.allocation.get(moodId) ?? [];
  if (!mood || !events.length) return { summary: '', activities: [] };

  // Pair venues for each event, deduping pairing venues within this mood so the
  // same bar isn't bolted onto all six events.
  const usedVenues = new Set<string>();
  const items: EventWithPairings[] = [];
  for (const event of events) {
    const raw = await pairVenuesForEvent(event.lat, event.lng, hourFromIso(event.start));
    const pairings = raw.filter((p) => {
      const k = p.venueName.toLowerCase();
      if (usedVenues.has(k)) return false;
      usedVenues.add(k);
      return true;
    });
    items.push({ event, pairings });
  }

  const activities = await writeActivities({ ctx, mood, generation, items });
  const summary = `${activities.length} real ${mood.label.toLowerCase()} options near ${ctx.neighborhood ?? ctx.city} tonight.`;
  return { summary, activities };
}

function hourFromIso(iso?: string): number | undefined {
  if (!iso) return undefined;
  const h = parseInt(iso.split('T')[1]?.slice(0, 2) ?? '', 10);
  return Number.isNaN(h) ? undefined : h;
}
