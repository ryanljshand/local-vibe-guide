// Event source registry: runs every enabled provider in parallel, then
// normalizes → dedupes → time-filters → scores. New sources plug in by
// implementing EventProvider and being added to PROVIDERS.

import type { EventItem } from '../types';
import { dedupeEvents, eventScore, filterToWindow, nicheScore } from '../events';
import type { EventProvider, FetchEventsParams } from './types';
import { MockEventProvider } from './mock';
import { TicketmasterProvider } from './ticketmaster';
import { EventbriteProvider } from './eventbrite';
import { RaProvider } from './ra';
import { EditorialProvider } from './editorial';

const mock = new MockEventProvider();

// Niche tier first (RA, editorial, Eventbrite), then mass-ticketing, then mock.
// Scoring — not order — decides ranking; order is just cosmetic.
const PROVIDERS: EventProvider[] = [
  new RaProvider(),
  new EditorialProvider(),
  new EventbriteProvider(),
  new TicketmasterProvider(),
];

export interface IngestResult {
  events: EventItem[];
  sourcesUsed: string[];
  /** True when no live source produced anything and the mock filled in. */
  mockOnly: boolean;
}

async function runProviders(providers: EventProvider[], params: FetchEventsParams) {
  const settled = await Promise.allSettled(providers.map((p) => p.fetch(params)));
  const events: EventItem[] = [];
  const sourcesUsed: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.length) {
      events.push(...r.value);
      sourcesUsed.push(providers[i].name);
    }
  });
  return { events, sourcesUsed };
}

export async function ingestEvents(params: FetchEventsParams): Promise<IngestResult> {
  const liveProviders = PROVIDERS.filter((p) => p.enabled());

  let { events: raw, sourcesUsed } = await runProviders(liveProviders, params);
  let mockOnly = false;

  // If nothing live came back (no keys, blocked network, off-season), fall back
  // to the mock so the app always has something to show.
  if (raw.length === 0) {
    const fb = await runProviders([mock], params);
    raw = fb.events;
    sourcesUsed = fb.sourcesUsed;
    mockOnly = true;
  }

  const scored = raw.map((e) => ({ ...e, niche: nicheScore(e) }));
  const deduped = dedupeEvents(scored);
  const windowed = filterToWindow(deduped, params.nowIso);
  windowed.sort((a, b) => eventScore(b) - eventScore(a));

  return { events: windowed, sourcesUsed, mockOnly };
}

export type { EventProvider, FetchEventsParams };
