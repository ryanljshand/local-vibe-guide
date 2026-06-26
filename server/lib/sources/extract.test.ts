import { describe, expect, it } from 'vitest';
import { extractEventNamesFromJson, extractJsonLdEvents } from './extract';
import { extractRaEmbedded } from './ra';
import { detectCity } from './cities';

function ldScript(obj: unknown): string {
  return `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body></body></html>`;
}

describe('extractJsonLdEvents', () => {
  it('parses a single MusicEvent with venue, geo, and price', () => {
    const html = ldScript({
      '@context': 'https://schema.org',
      '@type': 'MusicEvent',
      name: 'Floating Points (live)',
      startDate: '2026-06-26T22:00:00-07:00',
      location: {
        '@type': 'Place',
        name: 'The Echo',
        address: { streetAddress: '1822 Sunset Blvd', addressLocality: 'Los Angeles' },
        geo: { '@type': 'GeoCoordinates', latitude: 34.078, longitude: -118.26 },
      },
      offers: { '@type': 'Offer', price: '25', priceCurrency: 'USD', url: 'https://tix' },
      url: 'https://venue/floating-points',
      image: 'https://img/fp.jpg',
    });
    const events = extractJsonLdEvents(html, 'editorial');
    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.title).toBe('Floating Points (live)');
    expect(e.category).toBe('music');
    expect(e.venueName).toBe('The Echo');
    expect(e.address).toContain('Sunset');
    expect(e.lat).toBeCloseTo(34.078);
    expect(e.priceMin).toBe(25);
    expect(e.isFree).toBe(false);
    expect(e.source).toBe('editorial');
  });

  it('flattens an array and an @graph of events', () => {
    const html = ldScript([
      { '@type': 'ComedyEvent', name: 'Late Night Stand-up', url: 'https://a' },
      { '@graph': [{ '@type': 'TheaterEvent', name: 'Fringe One-Act', url: 'https://b' }] },
    ]);
    const events = extractJsonLdEvents(html, 'editorial');
    const titles = events.map((e) => e.title);
    expect(titles).toContain('Late Night Stand-up');
    expect(titles).toContain('Fringe One-Act');
    expect(events.find((e) => e.title === 'Late Night Stand-up')!.category).toBe('comedy');
    expect(events.find((e) => e.title === 'Fringe One-Act')!.category).toBe('theater');
  });

  it('marks a $0 offer as free', () => {
    const html = ldScript({ '@type': 'Event', name: 'Free Zine Fair', offers: { price: 0 }, url: 'https://z' });
    expect(extractJsonLdEvents(html, 'editorial')[0].isFree).toBe(true);
  });

  it('dedupes identical events and ignores non-event JSON-LD', () => {
    const html =
      ldScript({ '@type': 'Organization', name: 'Not An Event' }) +
      ldScript({ '@type': 'Event', name: 'Same Night', url: 'https://x' }) +
      ldScript({ '@type': 'Event', name: 'Same Night', url: 'https://x' });
    const events = extractJsonLdEvents(html, 'ra');
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Same Night');
  });

  it('returns nothing for HTML without JSON-LD', () => {
    expect(extractJsonLdEvents('<html><body>no data</body></html>', 'editorial')).toHaveLength(0);
  });
});

describe('extractEventNamesFromJson (fallback)', () => {
  it('pulls plausible event names from embedded JSON and skips chrome', () => {
    const html = `{"name":"Warehouse Disco Night"} {"name":"Privacy Policy"} {"name":"Midnight Ramen Popup"}`;
    const events = extractEventNamesFromJson(html, 'eventbrite');
    const titles = events.map((e) => e.title);
    expect(titles).toContain('Warehouse Disco Night');
    expect(titles).toContain('Midnight Ramen Popup');
    expect(titles).not.toContain('Privacy Policy');
  });
});

describe('extractRaEmbedded', () => {
  it('pairs an event title with its venue from the data blob', () => {
    const html = `{"title":"Hessle Audio Night","date":"2026-06-26","venue":{"id":"7","name":"Lot 613"}}`;
    const events = extractRaEmbedded(html);
    expect(events[0].title).toBe('Hessle Audio Night');
    expect(events[0].venueName).toBe('Lot 613');
    expect(events[0].category).toBe('nightlife');
  });
});

describe('detectCity', () => {
  it('matches LA from a neighborhood string and exposes KCRW', () => {
    const c = detectCity('Silver Lake, Los Angeles, US', 'Los Angeles');
    expect(c?.city).toBe('Los Angeles');
    expect(c?.editorial.some((s) => s.name === 'KCRW')).toBe(true);
    expect(c?.raRegion).toBe('us/losangeles');
  });

  it('returns undefined for an unknown city', () => {
    expect(detectCity('Reykjavik, IS', 'Reykjavik')).toBeUndefined();
  });
});
