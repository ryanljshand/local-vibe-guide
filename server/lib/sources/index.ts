// Event source registry: runs every enabled provider in parallel, then
// normalizes → dedupes → time-filters → scores. New sources (RA scraper,
// Dice, Luma, Eventbrite, editorial RAG) plug in by implementing EventProvider
// and being added to PROVIDERS.

import type { EventItem } from '../types';
import { dedupeEvents, eventScore, filterToWindow, nicheScore } from '../events';
import type { EventProvider, FetchEventsParams } from './types';
import { MockEventProvider } from './mock';
import { TicketmasterProvider } from './ticketmaster';

// Order is cosmetic; scoring decides ranking. Mock stays last as the fallback.
const PROVIDERS: EventProvider[] = [
  new TicketmasterProvider(),
  // new RaScraperProvider(),     // niche tier — to come
  // new EventbriteProvider(),
  // new LumaProvider(),
  new MockEventProvider(),
];

export interface IngestResult {
  events: EventItem[];
  sourcesUsed: string[];
  /** True when only the mock source ran (no live keys configured). */
  mockOnly: boolean;
}

export async function ingestEvents(params: FetchEventsParams): Promise<IngestResult> {
  const live = PROVIDERS.filter((p) => p.name !== 'mock' && p.enabled());
  const useMock = live.length === 0;
  const active = useMock ? PROVIDERS.filter((p) => p.name === 'mock') : live;

  const settled = await Promise.allSettled(active.map((p) => p.fetch(params)));
  const raw: EventItem[] = [];
  const sourcesUsed: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.length) {
      raw.push(...r.value);
      sourcesUsed.push(active[i].name);
    }
  });

  // Normalize → score niche → dedupe across sources → keep tonight → rank.
  const scored = raw.map((e) => ({ ...e, niche: nicheScore(e) }));
  const deduped = dedupeEvents(scored);
  const windowed = filterToWindow(deduped, params.nowIso);
  windowed.sort((a, b) => eventScore(b) - eventScore(a));

  return { events: windowed, sourcesUsed, mockOnly: useMock };
}

export type { EventProvider, FetchEventsParams };
