// Venue layer — the *pairing* sidekick, not the hero.
//
// Given an event's location, we find a nearby bar/restaurant/cafe to bookend it
// ("negroni beforehand, ramen after"). Foursquare/Google would add real ratings;
// for now we ship a keyless OSM provider plus a mock so pairings always render.

import type { PlacesSource, Venue, VenuePairing } from './types';
import { normalizeCategory } from './categories';

export interface NearbyParams {
  lat: number;
  lng: number;
  /** What kind of pairing we want. */
  want: 'drinks' | 'food' | 'coffee';
  radiusMeters?: number;
}

export interface PlacesProvider {
  name: PlacesSource;
  enabled(): boolean;
  nearby(params: NearbyParams): Promise<Venue[]>;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const WANT_AMENITIES: Record<NearbyParams['want'], string> = {
  drinks: 'bar|pub|biergarten|wine_bar',
  food: 'restaurant|fast_food',
  coffee: 'cafe',
};

/** OpenStreetMap / Overpass — keyless, real venues, but no ratings. */
export class OsmPlacesProvider implements PlacesProvider {
  name: PlacesSource = 'osm';
  enabled() {
    return process.env.PLACES_PROVIDER !== 'off';
  }
  async nearby(params: NearbyParams): Promise<Venue[]> {
    const radius = params.radiusMeters ?? 600;
    const amen = WANT_AMENITIES[params.want];
    const q = `[out:json][timeout:15];
(
  node["amenity"~"${amen}"]["name"](around:${radius},${params.lat},${params.lng});
);
out 30;`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(q)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data: any = await res.json();
      const venues: Venue[] = [];
      for (const el of data?.elements ?? []) {
        const tags = el.tags ?? {};
        if (!tags.name) continue;
        venues.push({
          id: `osm_${el.id}`,
          name: tags.name,
          neighborhood: tags['addr:suburb'] ?? tags['addr:neighbourhood'],
          lat: el.lat,
          lng: el.lon,
          distanceMeters: el.lat ? haversine(params.lat, params.lng, el.lat, el.lon) : undefined,
          categories: normalizeCategory(tags.amenity),
          rawCategory: tags.amenity,
          openingHours: tags.opening_hours,
          source: 'osm',
        });
      }
      return venues.sort((a, b) => (a.distanceMeters ?? 9e9) - (b.distanceMeters ?? 9e9));
    } catch {
      return [];
    }
  }
}

/** Deterministic mock so pairings render with zero network. */
export class MockPlacesProvider implements PlacesProvider {
  name: PlacesSource = 'mock';
  enabled() {
    return true;
  }
  async nearby(params: NearbyParams): Promise<Venue[]> {
    const names: Record<NearbyParams['want'], Array<[string, string, number, number]>> = {
      drinks: [['The Long Goodbye', 'cocktail bar', 4.6, 320], ['Hour Glass', 'wine bar', 4.5, 180], ['Corner Pub', 'pub', 4.3, 540]],
      food: [['Late Plate', 'restaurant', 4.7, 410], ['Counter Culture', 'restaurant ramen', 4.6, 260]],
      coffee: [['Slow Pour', 'cafe coffee', 4.5, 220]],
    };
    return names[params.want].map(([name, raw, rating, reviewCount], i): Venue => ({
      id: `mock_place_${params.want}_${i}`,
      name,
      lat: params.lat + 0.001 * (i + 1),
      lng: params.lng + 0.001 * (i + 1),
      distanceMeters: 150 + i * 120,
      categories: normalizeCategory(raw),
      rawCategory: raw,
      rating,
      reviewCount,
      source: 'mock',
    }));
  }
}

function activeProvider(): PlacesProvider {
  const choice = process.env.PLACES_PROVIDER;
  if (choice === 'osm') return new OsmPlacesProvider();
  if (choice === 'mock') return new MockPlacesProvider();
  // Default: try OSM, the orchestrator falls back to mock if it returns nothing.
  return new OsmPlacesProvider();
}

/**
 * Suggest venues to bookend an event. Returns up to two pairings (drinks before,
 * food after) using the best-rated nearby spots. Falls back to mock if the live
 * provider returns nothing, so a card always has a suggestion.
 */
export async function pairVenuesForEvent(
  lat: number | undefined,
  lng: number | undefined,
  hour: number | undefined,
): Promise<VenuePairing[]> {
  if (lat == null || lng == null) return [];
  const provider = activeProvider();
  const mock = new MockPlacesProvider();

  const wants: Array<{ want: NearbyParams['want']; kind: VenuePairing['kind']; note: string }> = [
    { want: 'drinks', kind: 'before', note: 'A drink beforehand' },
    { want: hour != null && hour >= 21 ? 'food' : 'coffee', kind: 'after', note: 'Keep it going after' },
  ];

  const pairings: VenuePairing[] = [];
  for (const w of wants) {
    let venues = await provider.nearby({ lat, lng, want: w.want });
    if (!venues.length) venues = await mock.nearby({ lat, lng, want: w.want });
    const pick = venues[0];
    if (!pick) continue;
    pairings.push({
      kind: w.kind,
      venueName: pick.name,
      neighborhood: pick.neighborhood,
      category: pick.rawCategory ?? pick.categories[0],
      rating: pick.rating,
      reviewCount: pick.reviewCount,
      note: w.note,
      lat: pick.lat,
      lng: pick.lng,
    });
  }
  return pairings;
}
