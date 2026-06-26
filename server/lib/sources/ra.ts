// Resident Advisor provider — the underground/electronic tier (the most niche
// source we have). RA has no public REST API, but its region listing pages embed
// schema.org JSON-LD events and a Next.js data blob we can parse.

import type { EventItem, EventSource } from '../types';
import type { EventProvider, FetchEventsParams } from './types';
import { detectCity } from './cities';
import { extractJsonLdEvents, fetchHtml } from './extract';
import { normalizeEventCategory } from '../events';

const scrapersOn = () => process.env.EVENT_SCRAPERS !== 'off';

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** RA embeds event data in its Next.js __NEXT_DATA__ blob; pull titles + venues. */
export function extractRaEmbedded(html: string): EventItem[] {
  const out: EventItem[] = [];
  const seen = new Set<string>();
  // Match {"title":"…", … "venue":{"name":"…"}} fragments loosely.
  for (const m of html.matchAll(/"title"\s*:\s*"([^"]{4,120})"[\s\S]{0,400}?"venue"\s*:\s*\{[^}]*?"name"\s*:\s*"([^"]{2,80})"/g)) {
    const title = m[1].replace(/\\u[\dA-Fa-f]{4}/g, (c) => String.fromCharCode(parseInt(c.slice(2), 16)));
    const venue = m[2];
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `ra_${hash(title + venue)}`,
      title,
      category: 'nightlife',
      venueName: venue,
      url: 'https://ra.co',
      source: 'ra',
    });
  }
  return out;
}

export class RaProvider implements EventProvider {
  name: EventSource = 'ra';
  enabled() {
    return scrapersOn();
  }
  async fetch(params: FetchEventsParams): Promise<EventItem[]> {
    const config = detectCity(params.city, params.city);
    if (!config?.raRegion) return [];
    const url = `https://ra.co/events/${config.raRegion}`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const structured = extractJsonLdEvents(html, 'ra', url).map((e) => ({
      ...e,
      // RA is overwhelmingly club/electronic; bias the category unless JSON-LD
      // clearly says otherwise.
      category: e.category === 'community' ? normalizeEventCategory(`club ${e.title}`) : e.category,
    }));
    if (structured.length >= 3) return structured;

    const embedded = extractRaEmbedded(html);
    const seen = new Set(structured.map((e) => e.title.toLowerCase()));
    return [...structured, ...embedded.filter((e) => !seen.has(e.title.toLowerCase()))];
  }
}
