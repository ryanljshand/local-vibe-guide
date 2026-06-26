import { describe, expect, it } from 'vitest';
import { allocateVenues } from './allocate';
import type { Mood, Venue } from './types';
import { normalizeCategory } from './categories';

const MOODS: Mood[] = [
  { id: 'm_social', kind: 'be_social', label: 'Out with people', subtitle: '' },
  { id: 'm_eat', kind: 'eat_drink', label: 'Feed me', subtitle: '' },
  { id: 'm_slow', kind: 'slow_down', label: 'Wind down', subtitle: '' },
  { id: 'm_arts', kind: 'arts_culture', label: 'Feed the brain', subtitle: '' },
];

let _id = 0;
function venue(name: string, rawCategory: string, rating?: number, reviewCount?: number): Venue {
  return {
    id: `v${_id++}`,
    name,
    lat: 45,
    lng: -122,
    rawCategory,
    categories: normalizeCategory(rawCategory),
    rating,
    reviewCount,
    source: 'mock',
  };
}

describe('allocateVenues', () => {
  const venues: Venue[] = [
    venue('Cocktail Den', 'cocktail bar', 4.6, 400),
    venue('Dive Pub', 'pub', 4.2, 900),
    venue('Night Owl Club', 'nightclub', 4.0, 600),
    venue('Ramen House', 'restaurant ramen', 4.7, 800),
    venue('Taco Stand', 'restaurant taqueria', 4.5, 300),
    venue('Corner Cafe', 'cafe coffee', 4.4, 250),
    venue('Quiet Library Bar', 'wine bar', 4.5, 120),
    venue('City Museum', 'museum', 4.6, 2000),
    venue('Indie Gallery', 'gallery', 4.3, 90),
    venue('Old Theater', 'theatre', 4.4, 500),
  ];

  it('never assigns the same venue to two moods', () => {
    const alloc = allocateVenues(MOODS, venues, { perMood: 3 });
    const seen = new Set<string>();
    for (const [, list] of alloc) {
      for (const sv of list) {
        expect(seen.has(sv.venue.id), `${sv.venue.name} assigned twice`).toBe(false);
        seen.add(sv.venue.id);
      }
    }
  });

  it('respects the per-mood cap', () => {
    const alloc = allocateVenues(MOODS, venues, { perMood: 2 });
    for (const [, list] of alloc) {
      expect(list.length).toBeLessThanOrEqual(2);
    }
  });

  it('places venues under a mood they actually fit', () => {
    const alloc = allocateVenues(MOODS, venues, { perMood: 3 });
    const arts = alloc.get('m_arts')!.map((s) => s.venue.name);
    // The museum/gallery/theater should land in arts, never in eat_drink.
    expect(arts.some((n) => ['City Museum', 'Indie Gallery', 'Old Theater'].includes(n))).toBe(true);
    const eat = alloc.get('m_eat')!.map((s) => s.venue.name);
    expect(eat).not.toContain('City Museum');
  });

  it('de-dupes identical venue ids in the input pool', () => {
    const dup = venues[0];
    const alloc = allocateVenues(MOODS, [...venues, dup, dup], { perMood: 6 });
    const all = [...alloc.values()].flat().filter((s) => s.venue.id === dup.id);
    expect(all.length).toBe(1);
  });

  it('orders each mood by descending score', () => {
    const alloc = allocateVenues(MOODS, venues, { perMood: 5 });
    for (const [, list] of alloc) {
      const scores = list.map((s) => s.score);
      const sorted = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sorted);
    }
  });
});
