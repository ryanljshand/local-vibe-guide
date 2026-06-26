import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorialProvider } from './editorial';
import { ingestEvents } from './index';

// A realistic JSON-LD page like a "hip local newspaper" listings page would serve.
function ldPage(events: object[]): string {
  return events
    .map((e) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...e })}</script>`)
    .join('\n');
}

function stubFetch(htmlFor: (url: string) => string) {
  vi.stubGlobal('fetch', async (url: string) => ({
    ok: true,
    status: 200,
    text: async () => htmlFor(String(url)),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const PARAMS = {
  lat: 34.05,
  lng: -118.24,
  city: 'Los Angeles',
  localDate: '2026-06-26',
  nowIso: '2026-06-26T18:00:00',
  neighborhoods: ['Silver Lake'],
};

describe('EditorialProvider (KCRW & co.)', () => {
  it('scrapes JSON-LD events from the curated LA outlets', async () => {
    stubFetch((url) => {
      if (url.includes('kcrw.com')) {
        return ldPage([
          { '@type': 'MusicEvent', name: 'KCRW Presents: Warehouse Set', startDate: '2026-06-26T22:00:00', location: { '@type': 'Place', name: 'The Lash' }, url: 'https://kcrw/e1' },
        ]);
      }
      return ldPage([
        { '@type': 'Event', name: 'Eastside Gallery Crawl', startDate: '2026-06-26T19:00:00', url: `${url}#e` },
      ]);
    });

    const events = await new EditorialProvider().fetch(PARAMS);
    const titles = events.map((e) => e.title);
    expect(titles).toContain('KCRW Presents: Warehouse Set');
    expect(events.every((e) => e.source === 'editorial')).toBe(true);
  });
});

describe('ingestEvents integration', () => {
  it('runs the scraper tier, niche-scores, dedupes across sources, and ranks editorial above ticketmaster', async () => {
    stubFetch((url) => {
      // Same event appears on RA and Eventbrite → must dedupe to one (RA wins).
      const shared = { '@type': 'MusicEvent', name: 'Midnight Disco at The Lash', startDate: '2026-06-26T23:00:00', location: { '@type': 'Place', name: 'The Lash' } };
      if (url.includes('ra.co')) return ldPage([{ ...shared, url: 'https://ra/x' }]);
      if (url.includes('eventbrite.com')) return ldPage([{ ...shared, url: 'https://eb/x' }]);
      if (url.includes('kcrw.com')) return ldPage([{ '@type': 'Event', name: 'Late Film Screening', startDate: '2026-06-26T20:00:00', url: 'https://kcrw/film' }]);
      return ''; // other editorial outlets empty
    });

    const { events, sourcesUsed, mockOnly } = await ingestEvents(PARAMS);

    expect(mockOnly).toBe(false); // live scrapers produced results
    const disco = events.filter((e) => /Midnight Disco/.test(e.title));
    expect(disco).toHaveLength(1); // deduped across RA + Eventbrite
    expect(disco[0].source).toBe('ra'); // niche source kept
    expect(sourcesUsed).toContain('ra');
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to mock when every live source is empty (blocked/off-season)', async () => {
    stubFetch(() => ''); // every fetch returns nothing
    const { mockOnly, events } = await ingestEvents(PARAMS);
    expect(mockOnly).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });
});
