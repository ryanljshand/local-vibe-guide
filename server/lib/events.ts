// Event-domain helpers: mood mapping, niche/quality scoring, dedup, time filters.

import type { EventCategory, EventItem, Mood, MoodKind } from './types';

/** Which mood each event category belongs under. Events are clustered into moods
 *  derived from what's actually happening tonight. */
export const CATEGORY_TO_MOOD: Record<EventCategory, MoodKind> = {
  music: 'be_social',
  nightlife: 'be_social',
  comedy: 'be_social',
  arts: 'arts_culture',
  theater: 'arts_culture',
  film: 'arts_culture',
  food: 'eat_drink',
  market: 'explore_outside',
  community: 'slow_down',
  wellness: 'slow_down',
  sports: 'get_moving',
  outdoor: 'explore_outside',
};

/** Fit of an event to a mood (1 if it's the event's home mood, else 0). */
export function eventMoodFit(kind: MoodKind, ev: EventItem): number {
  return CATEGORY_TO_MOOD[ev.category] === kind ? 1 : 0;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Niche score (0–1). The whole premise: surface the cool, hard-to-find stuff.
 * - Niche sources (RA, Dice, Luma, editorial, Eventbrite) score higher than the
 *   mass-ticketing sources (Ticketmaster, SeatGeek), which skew mainstream.
 * - Free / cheap events skew more local/underground; very pricey skews arena-show.
 * - A provided source popularity nudges it (mega-popular = less niche).
 */
export function nicheScore(ev: EventItem): number {
  const sourceBase: Record<EventItem['source'], number> = {
    ra: 0.9, dice: 0.85, luma: 0.82, editorial: 0.8, eventbrite: 0.7, meetup: 0.7,
    ticketmaster: 0.35, seatgeek: 0.4, mock: 0.6,
  };
  let s = sourceBase[ev.source] ?? 0.6;
  if (ev.isFree) s += 0.05;
  if (ev.priceMax != null && ev.priceMax > 120) s -= 0.15;
  if (ev.popularity != null) s -= (ev.popularity - 0.5) * 0.3; // very popular = less niche
  return clamp01(s);
}

/**
 * Overall event score for ranking/allocation (0–1): mostly niche, with a nudge
 * for having real logistics (a known venue/time makes it actionable).
 */
export function eventScore(ev: EventItem): number {
  const niche = ev.niche ?? nicheScore(ev);
  const actionable = (ev.venueName ? 0.5 : 0) + (ev.start ? 0.5 : 0);
  return clamp01(0.78 * niche + 0.22 * actionable);
}

/** Normalize a free-text category label into our EventCategory enum. */
export function normalizeEventCategory(raw: string | undefined | null): EventCategory {
  const s = (raw ?? '').toLowerCase();
  if (/club|dj|rave|warehouse|night ?life|techno|house|disco/.test(s)) return 'nightlife';
  if (/music|concert|gig|live|band|festival|jazz|hip ?hop|indie/.test(s)) return 'music';
  if (/comedy|stand ?up|improv/.test(s)) return 'comedy';
  if (/film|cinema|movie|screening/.test(s)) return 'film';
  if (/theat|play|musical|opera|dance|ballet/.test(s)) return 'theater';
  if (/art|gallery|exhibit|museum|opening|craft/.test(s)) return 'arts';
  if (/food|dinner|supper|tasting|pop ?up|brunch|wine|beer|cocktail/.test(s)) return 'food';
  if (/market|flea|bazaar|fair|vintage/.test(s)) return 'market';
  if (/run|yoga|fitness|hike|wellness|meditat|sound bath/.test(s)) return 'wellness';
  if (/sport|game|match|race|tournament/.test(s)) return 'sports';
  if (/park|outdoor|garden|nature|walk/.test(s)) return 'outdoor';
  if (/meetup|community|talk|workshop|networking|book club/.test(s)) return 'community';
  return 'community';
}

/** Cheap title-based dedup key: the same party often appears on 3 sites. */
function dedupKey(ev: EventItem): string {
  const t = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 6).join(' ');
  const day = ev.start ? ev.start.slice(0, 10) : '';
  return `${t}::${day}`;
}

/** Merge duplicate events across sources, preferring the more niche source's copy
 *  but keeping the richest fields. */
export function dedupeEvents(events: EventItem[]): EventItem[] {
  const byKey = new Map<string, EventItem>();
  for (const ev of events) {
    const key = dedupKey(ev);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, ev);
      continue;
    }
    // Keep the higher niche score as the base, fill missing fields from the other.
    const [base, other] = nicheScore(ev) >= nicheScore(existing) ? [ev, existing] : [existing, ev];
    byKey.set(key, {
      ...base,
      description: base.description ?? other.description,
      venueName: base.venueName ?? other.venueName,
      neighborhood: base.neighborhood ?? other.neighborhood,
      address: base.address ?? other.address,
      lat: base.lat ?? other.lat,
      lng: base.lng ?? other.lng,
      imageUrl: base.imageUrl ?? other.imageUrl,
      start: base.start ?? other.start,
    });
  }
  return [...byKey.values()];
}

/** Keep events relevant to "tonight/today" — drop ones already over or far in the future. */
export function filterToWindow(events: EventItem[], nowIso: string, horizonHours = 30): EventItem[] {
  const now = new Date(nowIso).getTime();
  const horizon = now + horizonHours * 3600 * 1000;
  return events.filter((ev) => {
    if (!ev.start) return true; // undated listings still count (ongoing/popups)
    const t = new Date(ev.start).getTime();
    if (Number.isNaN(t)) return true;
    return t >= now - 3 * 3600 * 1000 && t <= horizon;
  });
}

/** Build the mood list from the events we actually found, ordered by how much is
 *  happening in each. Only moods with events show up (plus we always allow the
 *  pure-venue fallback moods to be added by the caller). */
export function deriveMoodsFromEvents(events: EventItem[]): Mood[] {
  const LABELS: Record<MoodKind, { label: string; subtitle: string }> = {
    be_social:       { label: 'Out among people',     subtitle: 'shows, DJs, somewhere with a pulse' },
    eat_drink:       { label: 'Eat & drink something memorable', subtitle: 'popups, tastings, a proper dinner' },
    arts_culture:    { label: 'Feed your brain',       subtitle: 'openings, screenings, stage' },
    explore_outside: { label: 'Get outside',           subtitle: 'markets, gardens, fresh air' },
    get_moving:      { label: 'Break a sweat',         subtitle: 'move your body' },
    slow_down:       { label: 'Low-key & local',       subtitle: 'meetups, quiet corners' },
  };

  const counts = new Map<MoodKind, number>();
  for (const ev of events) {
    const k = CATEGORY_TO_MOOD[ev.category];
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([kind]) => ({ id: `mood_${kind}`, kind, label: LABELS[kind].label, subtitle: LABELS[kind].subtitle }));
}
