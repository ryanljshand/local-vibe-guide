// Quality + "niche" scoring.
//
// The goal is NOT "most popular" — that selects for tourist traps. We want
// "beloved locally": a high rating backed by enough reviews to trust, but not
// so many that it's a bucket-list cliche. A Bayesian-adjusted rating handles the
// trust, and a niche factor reshapes for the "hidden gem" feel.

import type { Venue } from './types';

export interface RankingOpts {
  /** Prior mean rating — what we assume before seeing reviews. */
  priorMean?: number;
  /** Prior strength — how many reviews it takes to overcome the prior. */
  priorWeight?: number;
}

/** Bayesian-adjusted rating in 0–5. Few reviews → pulled toward the prior. */
export function bayesianRating(
  rating: number,
  reviewCount: number,
  opts: RankingOpts = {},
): number {
  const m = opts.priorMean ?? 3.9;
  const C = opts.priorWeight ?? 25;
  const n = Math.max(0, reviewCount);
  return (C * m + rating * n) / (C + n);
}

/**
 * Niche factor (~0.8–1.15): rewards loved-but-not-overrun spots.
 * - A strong rating with a healthy-but-modest review count gets a bonus.
 * - A massive review count (a tourist magnet) gets a gentle penalty.
 */
export function nicheFactor(rating: number, reviewCount: number): number {
  let f = 1;
  if (rating >= 4.3 && reviewCount >= 40 && reviewCount <= 1500) f += 0.12;
  else if (rating >= 4.5 && reviewCount >= 20) f += 0.06;
  if (reviewCount > 6000) f -= 0.18;
  else if (reviewCount > 3000) f -= 0.08;
  if (reviewCount < 8) f -= 0.05; // too thin to trust as a "gem"
  return Math.max(0.8, Math.min(1.15, f));
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Quality score in 0–1.
 * Venues without rating signal (e.g. OSM) get a neutral-low baseline so that,
 * when rated venues are available, they win — but OSM-only cities still work.
 */
export function qualityScore(v: Venue, opts: RankingOpts = {}): number {
  if (v.rating == null || v.reviewCount == null || v.reviewCount <= 0) {
    return 0.42;
  }
  const bayes = bayesianRating(v.rating, v.reviewCount, opts); // 0–5
  const base = bayes / 5; // 0–1
  return clamp01(base * nicheFactor(v.rating, v.reviewCount));
}

/** Mild distance decay (0–1): closer is better, but it's gentle so a great spot
 *  a bit further still competes. ~1.0 at the door, ~0.7 at 3km. */
export function proximityScore(distanceMeters: number | undefined): number {
  if (distanceMeters == null) return 0.85;
  const km = distanceMeters / 1000;
  return clamp01(1 / (1 + km / 6));
}
