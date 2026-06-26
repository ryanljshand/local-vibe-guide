import type { EventItem, EventSource } from '../types';

export interface FetchEventsParams {
  lat: number;
  lng: number;
  city: string;
  /** YYYY-MM-DD in the user's local time. */
  localDate: string;
  /** ISO local "now", used for time-window filtering. */
  nowIso: string;
  /** Approx neighborhoods near the user, when known, for richer mock/labeling. */
  neighborhoods?: string[];
}

/** A pluggable event source. The registry runs every enabled provider in parallel. */
export interface EventProvider {
  name: EventSource;
  /** Whether this provider is usable right now (e.g. has its API key). */
  enabled(): boolean;
  fetch(params: FetchEventsParams): Promise<EventItem[]>;
}
