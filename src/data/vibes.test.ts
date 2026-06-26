import { describe, expect, it } from 'vitest';
import { vibeData, getAllActivities, getActivitiesByIds } from './vibes';

describe('vibeData integrity', () => {
  it('every vibe has subVibes, each with at least one activity', () => {
    for (const vibe of vibeData) {
      expect(vibe.subVibes?.length, `${vibe.id} has subVibes`).toBeGreaterThan(0);
      for (const sub of vibe.subVibes ?? []) {
        expect(sub.activities.length, `${sub.id} has activities`).toBeGreaterThan(0);
      }
    }
  });

  it('has globally unique activity ids', () => {
    const ids = getAllActivities().map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getActivitiesByIds', () => {
  it('resolves ids back to activities, preserving order', () => {
    const result = getActivitiesByIds(['c2', 'c1']);
    expect(result.map((a) => a.id)).toEqual(['c2', 'c1']);
    expect(result[0].name).toBe('Heart Coffee Roasters');
  });

  it('ignores unknown ids', () => {
    expect(getActivitiesByIds(['nope', 'c1']).map((a) => a.id)).toEqual(['c1']);
  });

  it('returns an empty array for no ids', () => {
    expect(getActivitiesByIds([])).toEqual([]);
  });
});
