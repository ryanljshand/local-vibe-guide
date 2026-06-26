// Curated per-city source registry.
//
// This is the "small army of humans" answer: instead of scraping the whole web,
// we keep a hand-picked list per city of the local tastemaker outlets — the hip
// alt-weeklies, public radio culture desks, and listings sites where the genuinely
// niche stuff lives (the kind of place a local would actually check). Grow this
// over time; adding a city is a few lines.
//
// `editorial[].url` pages are scraped for schema.org JSON-LD events.

import type { EventSource } from '../types';

export interface EditorialSource {
  name: string;
  url: string;
  source: EventSource;
}

export interface CityConfig {
  /** Display name. */
  city: string;
  /** Lowercase substrings that identify this city from a location string. */
  match: string[];
  /** Eventbrite city slug, e.g. "los-angeles--ca". */
  eventbriteSlug?: string;
  /** Resident Advisor region slug, e.g. "us/losangeles". */
  raRegion?: string;
  /** Local "hip newspaper" / tastemaker listings to scrape. */
  editorial: EditorialSource[];
}

export const CITIES: CityConfig[] = [
  {
    city: 'Los Angeles',
    match: ['los angeles', 'l.a.', ' la,', ', ca', 'silver lake', 'echo park', 'venice', 'highland park', 'dtla'],
    eventbriteSlug: 'los-angeles--ca',
    raRegion: 'us/losangeles',
    editorial: [
      { name: 'KCRW', url: 'https://www.kcrw.com/events', source: 'editorial' },
      { name: 'LA Weekly', url: 'https://www.laweekly.com/events/', source: 'editorial' },
      { name: 'Discover LA', url: 'https://www.discoverlosangeles.com/events', source: 'editorial' },
    ],
  },
  {
    city: 'New York',
    match: ['new york', 'nyc', 'brooklyn', 'manhattan', 'queens', ', ny'],
    eventbriteSlug: 'ny--new-york',
    raRegion: 'us/newyork',
    editorial: [
      { name: 'Brooklyn Vegan', url: 'https://www.brooklynvegan.com/tag/nyc-shows/', source: 'editorial' },
      { name: 'The Skint', url: 'https://theskint.com/', source: 'editorial' },
      { name: 'Time Out New York', url: 'https://www.timeout.com/newyork/things-to-do', source: 'editorial' },
    ],
  },
  {
    city: 'San Francisco',
    match: ['san francisco', 'sf,', ', ca bay', 'oakland', 'berkeley'],
    eventbriteSlug: 'ca--san-francisco',
    raRegion: 'us/sanfrancisco',
    editorial: [
      { name: 'KQED', url: 'https://www.kqed.org/events', source: 'editorial' },
      { name: '48 Hills', url: 'https://48hills.org/category/arts-culture/', source: 'editorial' },
      { name: 'Funcheap SF', url: 'https://sf.funcheap.com/', source: 'editorial' },
    ],
  },
  {
    city: 'Chicago',
    match: ['chicago', ', il'],
    eventbriteSlug: 'il--chicago',
    raRegion: 'us/chicago',
    editorial: [
      { name: 'Chicago Reader', url: 'https://chicagoreader.com/events/', source: 'editorial' },
      { name: 'WBEZ', url: 'https://www.wbez.org/events', source: 'editorial' },
      { name: 'Time Out Chicago', url: 'https://www.timeout.com/chicago/things-to-do', source: 'editorial' },
    ],
  },
  {
    city: 'Seattle',
    match: ['seattle', ', wa'],
    eventbriteSlug: 'wa--seattle',
    raRegion: 'us/seattle',
    editorial: [
      { name: 'The Stranger', url: 'https://www.thestranger.com/events', source: 'editorial' },
      { name: 'KEXP', url: 'https://www.kexp.org/events/', source: 'editorial' },
    ],
  },
  {
    city: 'Portland',
    match: ['portland', ', or'],
    eventbriteSlug: 'or--portland',
    raRegion: 'us/portland',
    editorial: [
      { name: 'Willamette Week', url: 'https://www.wweek.com/arts/', source: 'editorial' },
      { name: 'Portland Mercury', url: 'https://www.portlandmercury.com/events', source: 'editorial' },
      { name: 'OPB', url: 'https://www.opb.org/arts-and-life/', source: 'editorial' },
    ],
  },
  {
    city: 'Austin',
    match: ['austin', ', tx'],
    eventbriteSlug: 'tx--austin',
    raRegion: 'us/texas',
    editorial: [
      { name: 'Austin Chronicle', url: 'https://www.austinchronicle.com/events/', source: 'editorial' },
      { name: 'KUTX', url: 'https://kutx.org/events/', source: 'editorial' },
      { name: 'Do512', url: 'https://do512.com/', source: 'editorial' },
    ],
  },
];

/** Find the curated config for a location string, if we have one. */
export function detectCity(location: string | undefined, city?: string): CityConfig | undefined {
  const hay = `${location ?? ''} ${city ?? ''}`.toLowerCase();
  let best: CityConfig | undefined;
  for (const c of CITIES) {
    if (c.match.some((m) => hay.includes(m))) {
      // Prefer the most specific (longest) match.
      if (!best) best = c;
    }
  }
  return best;
}
