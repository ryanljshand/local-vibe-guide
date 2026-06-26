// Category normalization + mood-fit scoring.
//
// Every provider labels venues differently (OSM amenity tags, Foursquare category
// ids, Google place types). We normalize everything to a small set of keys, then
// score how well a venue fits each mood. Fit is what lets us partition venues
// across moods without overlap.

import type { MoodKind } from './types';

export type CategoryKey =
  | 'bar'
  | 'cocktail_bar'
  | 'wine_bar'
  | 'brewery'
  | 'pub'
  | 'nightclub'
  | 'live_music'
  | 'karaoke'
  | 'restaurant'
  | 'cafe'
  | 'coffee'
  | 'bakery'
  | 'dessert'
  | 'food_hall'
  | 'museum'
  | 'gallery'
  | 'theater'
  | 'cinema'
  | 'bookstore'
  | 'library'
  | 'park'
  | 'garden'
  | 'trail'
  | 'viewpoint'
  | 'gym'
  | 'climbing'
  | 'yoga'
  | 'pool'
  | 'bowling'
  | 'arcade'
  | 'spa'
  | 'market'
  | 'shop'
  | 'venue';

/** Substring rules applied (case-insensitive) to a provider's raw category string.
 *  First match wins, so order from most-specific to least. */
const RULES: Array<[RegExp, CategoryKey]> = [
  [/cocktail|speakeasy|lounge/, 'cocktail_bar'],
  [/wine/, 'wine_bar'],
  [/brew|taproom|beer garden|biergarten/, 'brewery'],
  [/\bpub\b|gastropub/, 'pub'],
  [/night ?club|\bclub\b|disco/, 'nightclub'],
  [/karaoke/, 'karaoke'],
  [/live music|music venue|concert|jazz|band/, 'live_music'],
  [/coffee/, 'coffee'],
  [/cafe|café|caf\b/, 'cafe'],
  [/bakery|patisserie/, 'bakery'],
  [/dessert|ice cream|gelato|creamery|donut|doughnut/, 'dessert'],
  [/food hall|food court|food pod|market hall/, 'food_hall'],
  [/restaurant|diner|eatery|bistro|trattoria|taqueria|ramen|sushi|bbq|steakhouse|pizz/, 'restaurant'],
  [/\bbar\b/, 'bar'],
  [/museum/, 'museum'],
  [/gallery|art center|arts center|arts centre/, 'gallery'],
  [/theat(er|re)|playhouse|opera/, 'theater'],
  [/cinema|movie/, 'cinema'],
  [/book/, 'bookstore'],
  [/library/, 'library'],
  [/botanical|garden|arboretum/, 'garden'],
  [/\bpark\b|playground/, 'park'],
  [/trail|hik|nature reserve|wilderness/, 'trail'],
  [/viewpoint|overlook|scenic|lookout/, 'viewpoint'],
  [/climb|boulder/, 'climbing'],
  [/yoga|pilates/, 'yoga'],
  [/swimming|\bpool\b/, 'pool'],
  [/bowl/, 'bowling'],
  [/arcade|barcade|game/, 'arcade'],
  [/\bspa\b|sauna|onsen|bathhouse/, 'spa'],
  [/gym|fitness|sports cent/, 'gym'],
  [/market|grocery|farmers/, 'market'],
  [/shop|store|boutique|retail|thrift|vintage|record/, 'shop'],
];

export function normalizeCategory(raw: string | undefined | null): CategoryKey[] {
  if (!raw) return ['venue'];
  const lower = raw.toLowerCase();
  const hits: CategoryKey[] = [];
  for (const [re, key] of RULES) {
    if (re.test(lower) && !hits.includes(key)) hits.push(key);
  }
  return hits.length ? hits : ['venue'];
}

/** Weighted fit of each category to each mood. Higher = better match. Missing = 0. */
const MOOD_FIT: Record<MoodKind, Partial<Record<CategoryKey, number>>> = {
  be_social: {
    bar: 1, cocktail_bar: 1, wine_bar: 0.9, brewery: 0.95, pub: 1, nightclub: 1,
    live_music: 0.95, karaoke: 0.9, arcade: 0.8, bowling: 0.75, food_hall: 0.7, restaurant: 0.4,
  },
  eat_drink: {
    restaurant: 1, food_hall: 0.95, cafe: 0.7, bakery: 0.7, dessert: 0.75,
    brewery: 0.6, wine_bar: 0.6, pub: 0.5, market: 0.5, coffee: 0.55,
  },
  slow_down: {
    cafe: 1, coffee: 0.95, wine_bar: 0.85, bookstore: 0.9, library: 0.85,
    bakery: 0.7, spa: 0.9, dessert: 0.6, garden: 0.6,
  },
  get_moving: {
    gym: 1, climbing: 1, yoga: 0.95, pool: 0.9, bowling: 0.7, trail: 0.85,
    park: 0.6,
  },
  arts_culture: {
    museum: 1, gallery: 1, theater: 1, cinema: 0.9, live_music: 0.8,
    bookstore: 0.6, library: 0.5,
  },
  explore_outside: {
    park: 1, garden: 1, trail: 1, viewpoint: 1, market: 0.6,
  },
};

/** Best fit (0–1) of a venue's categories to a mood. */
export function moodFit(kind: MoodKind, categories: CategoryKey[]): number {
  const table = MOOD_FIT[kind];
  let best = 0;
  for (const c of categories) {
    const f = table[c] ?? 0;
    if (f > best) best = f;
  }
  return best;
}

/** The OSM amenity/leisure regex union used to *fetch* candidates for a mood. */
export function osmSelectorsFor(kind: MoodKind): { amenities: string[]; leisure: string[] } {
  switch (kind) {
    case 'be_social':
      return { amenities: ['bar', 'pub', 'nightclub', 'biergarten'], leisure: [] };
    case 'eat_drink':
      return { amenities: ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub'], leisure: [] };
    case 'slow_down':
      return { amenities: ['cafe', 'library'], leisure: ['spa'] };
    case 'get_moving':
      return { amenities: ['gym'], leisure: ['fitness_centre', 'sports_centre', 'swimming_pool', 'pitch'] };
    case 'arts_culture':
      return { amenities: ['theatre', 'cinema', 'arts_centre'], leisure: [] };
    case 'explore_outside':
      return { amenities: ['marketplace'], leisure: ['park', 'garden', 'nature_reserve'] };
  }
}
