import type { MoodKind } from '@/hooks/useActivities';

export interface MoodVisual {
  emoji: string;
  /** Tailwind background class (defined in tailwind.config tile palette). */
  bg: string;
}

export const MOOD_VISUALS: Record<MoodKind, MoodVisual> = {
  be_social: { emoji: '🪩', bg: 'bg-tile-pink' },
  eat_drink: { emoji: '🍜', bg: 'bg-tile-peach' },
  slow_down: { emoji: '🍵', bg: 'bg-tile-blue' },
  get_moving: { emoji: '🏃', bg: 'bg-tile-sage' },
  arts_culture: { emoji: '🎨', bg: 'bg-tile-lavender' },
  explore_outside: { emoji: '🌳', bg: 'bg-tile-green' },
};

const CATEGORY_BG: Record<string, string> = {
  music: 'bg-tile-pink',
  nightlife: 'bg-tile-pink',
  comedy: 'bg-tile-amber',
  arts: 'bg-tile-lavender',
  theater: 'bg-tile-lavender',
  film: 'bg-tile-lavender',
  food: 'bg-tile-peach',
  market: 'bg-tile-yellow',
  community: 'bg-tile-blue',
  sports: 'bg-tile-sage',
  wellness: 'bg-tile-blue',
  outdoor: 'bg-tile-green',
};

export function categoryBg(category: string): string {
  return CATEGORY_BG[category] ?? 'bg-tile-amber';
}
