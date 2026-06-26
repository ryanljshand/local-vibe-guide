import { describe, expect, it } from 'vitest';
import {
  dedupeEvents,
  deriveMoodsFromEvents,
  eventScore,
  filterToWindow,
  nicheScore,
  normalizeEventCategory,
} from './events';
import type { EventItem } from './types';

function ev(p: Partial<EventItem> & { id: string; title: string; source: EventItem['source'] }): EventItem {
  return { category: 'music', url: 'https://x', ...p } as EventItem;
}

describe('normalizeEventCategory', () => {
  it('maps messy labels to the enum', () => {
    expect(normalizeEventCategory('Warehouse techno all-nighter')).toBe('nightlife');
    expect(normalizeEventCategory('Stand-up comedy showcase')).toBe('comedy');
    expect(normalizeEventCategory('Natural wine popup dinner')).toBe('food');
    expect(normalizeEventCategory('Vintage flea market')).toBe('market');
  });
});

describe('nicheScore', () => {
  it('ranks underground sources above mass-ticketing', () => {
    const ra = ev({ id: '1', title: 'Loft party', source: 'ra' });
    const tm = ev({ id: '2', title: 'Arena tour', source: 'ticketmaster', priceMax: 200 });
    expect(nicheScore(ra)).toBeGreaterThan(nicheScore(tm));
  });
});

describe('dedupeEvents', () => {
  it('collapses the same event listed on multiple sites, keeping the niche copy and richest fields', () => {
    const raw = [
      ev({ id: 'tm1', title: 'Midnight Disco at The Warehouse', source: 'ticketmaster', start: '2026-06-26T23:00:00' }),
      ev({ id: 'ra1', title: 'Midnight Disco at the Warehouse!', source: 'ra', start: '2026-06-26T23:00:00', venueName: 'The Warehouse', neighborhood: 'Eastside' }),
    ];
    const out = dedupeEvents(raw);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('ra'); // niche copy wins
    expect(out[0].venueName).toBe('The Warehouse'); // richest field carried over
  });
});

describe('filterToWindow', () => {
  it('keeps tonight, drops finished and far-future events', () => {
    const now = '2026-06-26T20:00:00';
    const events = [
      ev({ id: 'past', title: 'Brunch', source: 'mock', start: '2026-06-26T10:00:00' }),
      ev({ id: 'soon', title: 'DJ set', source: 'mock', start: '2026-06-26T23:00:00' }),
      ev({ id: 'far', title: 'Next week show', source: 'mock', start: '2026-07-10T20:00:00' }),
      ev({ id: 'undated', title: 'Ongoing popup', source: 'mock' }),
    ];
    const kept = filterToWindow(events, now).map((e) => e.id);
    expect(kept).toContain('soon');
    expect(kept).toContain('undated');
    expect(kept).not.toContain('past');
    expect(kept).not.toContain('far');
  });
});

describe('deriveMoodsFromEvents', () => {
  it('builds moods only for categories present, busiest first', () => {
    const events = [
      ev({ id: '1', title: 'a', source: 'ra', category: 'nightlife' }),
      ev({ id: '2', title: 'b', source: 'ra', category: 'nightlife' }),
      ev({ id: '3', title: 'c', source: 'editorial', category: 'arts' }),
    ];
    const moods = deriveMoodsFromEvents(events);
    expect(moods[0].kind).toBe('be_social'); // nightlife → be_social, most events
    expect(moods.map((m) => m.kind)).toContain('arts_culture');
    expect(moods.map((m) => m.kind)).not.toContain('get_moving');
  });
});

describe('eventScore', () => {
  it('rewards niche + actionable (known venue & time)', () => {
    const rich = ev({ id: '1', title: 'Loft rave', source: 'ra', venueName: 'Loft', start: '2026-06-26T23:00:00' });
    const bare = ev({ id: '2', title: 'Mystery', source: 'ticketmaster' });
    expect(eventScore(rich)).toBeGreaterThan(eventScore(bare));
  });
});
