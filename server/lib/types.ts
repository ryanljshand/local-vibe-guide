// Shared domain types for the recommendation engine.

export type MoodKind =
  | 'be_social'
  | 'eat_drink'
  | 'slow_down'
  | 'get_moving'
  | 'arts_culture'
  | 'explore_outside';

export const MOOD_KINDS: MoodKind[] = [
  'be_social',
  'eat_drink',
  'slow_down',
  'get_moving',
  'arts_culture',
  'explore_outside',
];

export type PlacesSource = 'foursquare' | 'google' | 'osm' | 'mock';

export type EventSource =
  | 'ticketmaster'
  | 'seatgeek'
  | 'eventbrite'
  | 'ra'
  | 'meetup'
  | 'dice'
  | 'luma'
  | 'editorial'
  | 'mock';

/** Broad event category — drives mood clustering. */
export type EventCategory =
  | 'music'
  | 'nightlife'
  | 'arts'
  | 'theater'
  | 'comedy'
  | 'film'
  | 'food'
  | 'market'
  | 'community'
  | 'sports'
  | 'wellness'
  | 'outdoor';

/**
 * The hero of the app: a real, time-bound thing happening near you. Events are
 * NOT on Google Maps / Foursquare — they come from event sources (Ticketmaster,
 * RA.co, Eventbrite, Luma, blogs, …). A great venue is the *pairing*, not the point.
 */
export interface EventItem {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  /** ISO start/end when known. */
  start?: string;
  end?: string;
  venueName?: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  priceMin?: number;
  priceMax?: number;
  isFree?: boolean;
  imageUrl?: string;
  url: string;
  source: EventSource;
  /** Human-facing credit for where it was found, e.g. "KCRW", "Resident Advisor". */
  sourceLabel?: string;
  /** Source-native popularity signal (followers, sales, listing rank…), 0–1 when present. */
  popularity?: number;
  /** Derived 0–1 "how niche / hidden-gem" score. */
  niche?: number;
}

/** A nearby venue suggested to bookend an event (drinks before, bite after). */
export interface VenuePairing {
  kind: 'before' | 'after' | 'nearby';
  venueName: string;
  neighborhood?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  note?: string;
  lat?: number;
  lng?: number;
}

/** A real-world venue, normalized across providers. The fields beyond name/category
 *  are what make hyper-local + niche recommendations possible. */
export interface Venue {
  id: string;
  name: string;
  /** Neighborhood (e.g. "Silver Lake"), not just the city. The lever for hyper-local. */
  neighborhood?: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
  /** Normalized category keys (see categories.ts), most-specific first. */
  categories: string[];
  /** Provider's raw category label, kept for prompts/debug. */
  rawCategory?: string;
  /** 0–5. Absent for sources without ratings (e.g. OSM). */
  rating?: number;
  reviewCount?: number;
  /** 1 (cheap) – 4 (pricey). */
  priceLevel?: number;
  openingHours?: string;
  /** Editorial blurb / "why it's good" text when the provider has one. */
  editorial?: string;
  url?: string;
  source: PlacesSource;
}

export interface GeoContext {
  greeting: string;
  city: string;
  neighborhood?: string;
  /** Human label: "Silver Lake, Los Angeles, US" or "Portland, US". */
  location: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  timeOfDay: string;
  dayOfWeek: string;
  localDate: string;
  localHour: number;
  /** True when live geo/weather lookups were unavailable and defaults were used. */
  degraded?: boolean;
}

export interface Mood {
  id: string;
  kind: MoodKind;
  label: string;
  subtitle: string;
}

export interface ActivityPlaylist {
  /** A specific Spotify search query, e.g. "late night jazz bar". */
  query: string;
  mood: string;
}

/** A finished, user-facing recommendation card. */
export interface Activity {
  id: string;
  title: string;
  description: string;
  venueName: string;
  neighborhood?: string;
  address?: string;
  category: string;
  duration: string;
  energyLevel: 'Low' | 'Medium' | 'High';
  emoji: string;
  tips: string[];
  isLocalEvent: boolean;
  specialNote?: string | null;
  /** Where this event was surfaced from, e.g. "KCRW" — credited on the card. */
  sourceLabel?: string;
  /** Deep link to the original listing. */
  url?: string;
  playlists: ActivityPlaylist[];
  /** Carried through for the UI (maps link, ranking transparency). */
  rating?: number;
  reviewCount?: number;
  lat?: number;
  lng?: number;
}

export interface ScoredVenue {
  venue: Venue;
  /** Quality score in 0–1 (see ranking.ts). */
  quality: number;
  /** Fit to the assigned mood in 0–1. */
  fit: number;
  /** Combined score used for allocation. */
  score: number;
}
