// Eventbrite provider. Scrapes the public city listings page: JSON-LD first
// (structured events), then a name-only fallback for when the markup shifts.

import type { EventItem, EventSource } from '../types';
import type { EventProvider, FetchEventsParams } from './types';
import { detectCity } from './cities';
import { extractEventNamesFromJson, extractJsonLdEvents, fetchHtml } from './extract';

const scrapersOn = () => process.env.EVENT_SCRAPERS !== 'off';

function slugFor(params: FetchEventsParams): string {
  const config = detectCity(params.city, params.city);
  if (config?.eventbriteSlug) return config.eventbriteSlug;
  return params.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class EventbriteProvider implements EventProvider {
  name: EventSource = 'eventbrite';
  enabled() {
    return scrapersOn();
  }
  async fetch(params: FetchEventsParams): Promise<EventItem[]> {
    const slug = slugFor(params);
    const url = `https://www.eventbrite.com/d/${slug}/events--today/`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const structured = extractJsonLdEvents(html, 'eventbrite', url);
    if (structured.length >= 3) return structured;

    // Markup didn't expose JSON-LD — fall back to event names embedded in the
    // page's data blobs.
    const names = extractEventNamesFromJson(html, 'eventbrite', 10);
    // Merge, preferring structured entries.
    const seen = new Set(structured.map((e) => e.title.toLowerCase()));
    return [...structured, ...names.filter((n) => !seen.has(n.title.toLowerCase()))];
  }
}
