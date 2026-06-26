import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getTimeOfDay,
  getDayName,
  getTimeLabel,
  getWeatherEmoji,
  getWeatherLabel,
  type WeatherCondition,
} from './concierge';

afterEach(() => {
  vi.useRealTimers();
});

function freezeAt(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

describe('getTimeOfDay', () => {
  it.each([
    ['2026-06-26T02:00:00', 'late-night'],
    ['2026-06-26T07:30:00', 'early-morning'],
    ['2026-06-26T10:00:00', 'morning'],
    ['2026-06-26T13:00:00', 'midday'],
    ['2026-06-26T16:00:00', 'afternoon'],
    ['2026-06-26T19:30:00', 'evening'],
    ['2026-06-26T22:00:00', 'night'],
  ])('maps %s to %s', (iso, expected) => {
    freezeAt(iso);
    expect(getTimeOfDay()).toBe(expected);
  });

  it('treats boundary hours by the lower bucket', () => {
    freezeAt('2026-06-26T06:00:00'); // exactly 6 -> early-morning, not late-night
    expect(getTimeOfDay()).toBe('early-morning');
  });
});

describe('getDayName', () => {
  it('returns the weekday name', () => {
    freezeAt('2026-06-26T12:00:00'); // a Friday
    expect(getDayName()).toBe('Friday');
  });
});

describe('getTimeLabel', () => {
  it('renders human-friendly labels for every time of day', () => {
    expect(getTimeLabel('early-morning')).toBe('early morning');
    expect(getTimeLabel('late-night')).toBe('late night');
    expect(getTimeLabel('midday')).toBe('midday');
  });
});

describe('weather helpers', () => {
  const conditions: WeatherCondition[] = ['sunny', 'cloudy', 'rainy', 'partly-cloudy', 'foggy'];

  it('returns an emoji and label for every condition', () => {
    for (const c of conditions) {
      expect(getWeatherEmoji(c)).toBeTruthy();
      expect(getWeatherLabel(c)).toBeTruthy();
    }
  });

  it('capitalizes labels', () => {
    expect(getWeatherLabel('sunny')).toBe('Sunny');
    expect(getWeatherLabel('partly-cloudy')).toBe('Partly cloudy');
  });
});
