// Context bar data types and helpers
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy' | 'foggy';

export interface ConciergeContext {
  city: string;
  neighborhood: string;
  weather: WeatherCondition;
  tempF: number;
  timeOfDay: 'early-morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late-night';
  dayName: string;
}

export function getTimeOfDay(): ConciergeContext['timeOfDay'] {
  const h = new Date().getHours();
  if (h < 6)  return 'late-night';
  if (h < 9)  return 'early-morning';
  if (h < 12) return 'morning';
  if (h < 14) return 'midday';
  if (h < 18) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function getDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

export function getTimeLabel(t: ConciergeContext['timeOfDay']): string {
  const map: Record<ConciergeContext['timeOfDay'], string> = {
    'early-morning': 'early morning',
    'morning':       'morning',
    'midday':        'midday',
    'afternoon':     'afternoon',
    'evening':       'evening',
    'night':         'night',
    'late-night':    'late night',
  };
  return map[t];
}

export function getWeatherEmoji(w: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    sunny:          '☀️',
    cloudy:         '☁️',
    rainy:          '🌧️',
    'partly-cloudy': '⛅',
    foggy:          '🌫️',
  };
  return map[w];
}

export function getWeatherLabel(w: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    sunny:          'Sunny',
    cloudy:         'Cloudy',
    rainy:          'Rainy',
    'partly-cloudy': 'Partly cloudy',
    foggy:          'Foggy',
  };
  return map[w];
}
