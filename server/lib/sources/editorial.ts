// Editorial provider — the "local hip newspaper" tier (KCRW, Chicago Reader,
// The Stranger, Brooklyn Vegan, …). Driven by the curated per-city registry in
// cities.ts. Scrapes schema.org JSON-LD events from each outlet's listings page.

import type { EventItem, EventSource } from '../types';
import type { EventProvider, FetchEventsParams } from './types';
import { detectCity } from './cities';
import { extractJsonLdEvents, fetchHtml } from './extract';

const scrapersOn = () => process.env.EVENT_SCRAPERS !== 'off';

export class EditorialProvider implements EventProvider {
  name: EventSource = 'editorial';
  enabled() {
    return scrapersOn();
  }
  async fetch(params: FetchEventsParams): Promise<EventItem[]> {
    const config = detectCity(params.city, params.city);
    if (!config?.editorial.length) return [];

    const results = await Promise.allSettled(
      config.editorial.map(async (src) => {
        const html = await fetchHtml(src.url);
        if (!html) return [] as EventItem[];
        // Tag each event with the outlet name so the UI can credit the source.
        return extractJsonLdEvents(html, 'editorial', src.url).map((e) => ({
          ...e,
          sourceLabel: src.name,
          description: e.description ?? `Spotted via ${src.name}.`,
        }));
      }),
    );

    const out: EventItem[] = [];
    for (const r of results) if (r.status === 'fulfilled') out.push(...r.value);
    return out;
  }
}
