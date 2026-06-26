// Central cross-mood allocation.
//
// This is the fix for "the same thing showed up under every mood." Instead of
// each mood independently querying and picking (the Replit bug), we score every
// (mood, item) pair once and greedily assign each item to AT MOST ONE mood.
// An item can therefore never repeat across moods — it's impossible by
// construction, not by luck/shuffling.
//
// The greedy core is generic over the item type, so it works for events (the
// hero) and for pure-venue fallbacks alike.

import type { Mood, ScoredVenue, Venue } from './types';
import { moodFit, type CategoryKey } from './categories';
import { proximityScore, qualityScore, type RankingOpts } from './ranking';

export interface Candidate<T> {
  moodId: string;
  /** Stable identity used for dedup across moods. */
  key: string;
  /** Fit of this item to the mood, 0–1. */
  fit: number;
  /** Combined score used to order assignment, higher wins. */
  score: number;
  item: T;
}

export interface GreedyOpts {
  perMood?: number;
}

/**
 * Generic greedy dedup assignment.
 *
 * Returns moodId → items[] such that:
 *  - every `key` appears under at most one mood, and
 *  - each mood holds at most `perMood` items (fewer if candidates run out).
 *
 * Taking the globally-highest-scoring eligible pair first gives each item to the
 * mood that wants it most, maximizing total fit while keeping output stable.
 */
export function greedyAllocate<T>(
  moodIds: string[],
  candidates: Candidate<T>[],
  opts: GreedyOpts = {},
): Map<string, Candidate<T>[]> {
  const perMood = opts.perMood ?? 6;
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  const result = new Map<string, Candidate<T>[]>();
  for (const id of moodIds) result.set(id, []);
  const used = new Set<string>();

  for (const c of sorted) {
    if (used.has(c.key)) continue;
    const bucket = result.get(c.moodId);
    if (!bucket || bucket.length >= perMood) continue;
    bucket.push(c);
    used.add(c.key);
  }
  return result;
}

export interface AllocateOpts {
  perMood?: number;
  /** Minimum fit for a venue to be eligible for a mood at all. */
  minFit?: number;
  ranking?: RankingOpts;
  /** Relative weights for the combined score. */
  weights?: { fit?: number; quality?: number; proximity?: number };
}

/**
 * Venue allocator (used for the pure-venue fallback layer). Built on the generic
 * greedy core, so it inherits the no-overlap guarantee.
 */
export function allocateVenues(
  moods: Mood[],
  venues: Venue[],
  opts: AllocateOpts = {},
): Map<string, ScoredVenue[]> {
  const minFit = opts.minFit ?? 0.25;
  const w = opts.weights ?? {};
  const wFit = w.fit ?? 0.45;
  const wQual = w.quality ?? 0.4;
  const wProx = w.proximity ?? 0.15;

  // De-dupe the input pool by id (providers can return the same place twice).
  const byId = new Map<string, Venue>();
  for (const v of venues) if (!byId.has(v.id)) byId.set(v.id, v);

  const candidates: Candidate<ScoredVenue>[] = [];
  for (const mood of moods) {
    for (const venue of byId.values()) {
      const fit = moodFit(mood.kind, venue.categories as CategoryKey[]);
      if (fit < minFit) continue;
      const quality = qualityScore(venue, opts.ranking);
      const prox = proximityScore(venue.distanceMeters);
      const score = wFit * fit + wQual * quality + wProx * prox;
      candidates.push({ moodId: mood.id, key: venue.id, fit, score, item: { venue, fit, quality, score } });
    }
  }

  const allocated = greedyAllocate(moods.map((m) => m.id), candidates, { perMood: opts.perMood });
  const result = new Map<string, ScoredVenue[]>();
  for (const [moodId, list] of allocated) result.set(moodId, list.map((c) => c.item));
  return result;
}
