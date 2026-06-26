// Location + weather context. Keyless (Open-Meteo + Nominatim).
//
// Crucial vs. the Replit version: we reverse-geocode at NEIGHBORHOOD zoom and
// keep the neighborhood, so recommendations can be hyper-local ("Silver Lake")
// rather than city-wide ("Los Angeles").

import type { GeoContext } from './types';

async function getJson(url: string, timeoutMs = 6000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LocalVibeGuide/1.0 (contact: app@example.com)', Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly cloudy';
  if (code === 3) return 'cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'rainy';
  if (code <= 86) return 'snowy';
  return 'stormy';
}

function hourToTimeOfDay(hour: number): string {
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function isoToDayOfWeek(iso: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : days[d.getDay()];
}

export interface ResolveParams {
  lat?: number;
  lng?: number;
  location?: string;
}

// Tiny offline gazetteer so a named city still maps to plausible coords when
// live geocoding is unavailable (blocked network, no connectivity).
const FALLBACK_CITIES: Record<string, { lat: number; lng: number; city: string; country: string }> = {
  portland: { lat: 45.5231, lng: -122.6765, city: 'Portland', country: 'US' },
  'los angeles': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'US' },
  'new york': { lat: 40.7128, lng: -74.006, city: 'New York', country: 'US' },
  'san francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'US' },
  chicago: { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'US' },
  seattle: { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'US' },
  austin: { lat: 30.2672, lng: -97.7431, city: 'Austin', country: 'US' },
  london: { lat: 51.5074, lng: -0.1278, city: 'London', country: 'GB' },
};

function fallbackCity(label?: string) {
  const key = (label ?? '').toLowerCase();
  for (const name of Object.keys(FALLBACK_CITIES)) {
    if (key.includes(name)) return FALLBACK_CITIES[name];
  }
  const cityLabel = (label?.split(',')[0] ?? 'Your city').trim() || 'Your city';
  return { ...FALLBACK_CITIES.portland, city: cityLabel };
}

function assemble(args: {
  lat: number;
  lng: number;
  city: string;
  neighborhood?: string;
  country: string;
  temperature: number;
  condition: string;
  localTime: string;
  degraded: boolean;
}): GeoContext {
  const { lat, lng, city, neighborhood, country, temperature, condition, localTime, degraded } = args;
  const localHour = parseInt(localTime.split('T')[1]?.slice(0, 2) ?? '20', 10);
  const place = neighborhood ? `${neighborhood}, ${city}` : city;
  const location = country ? `${place}, ${country}` : place;
  return {
    greeting: `It's a ${condition} ${isoToDayOfWeek(localTime)} ${hourToTimeOfDay(localHour)} in ${place} — ${temperature}°F.`,
    city,
    neighborhood,
    location,
    lat,
    lng,
    temperature,
    condition,
    timeOfDay: hourToTimeOfDay(localHour),
    dayOfWeek: isoToDayOfWeek(localTime),
    localDate: localTime.split('T')[0],
    localHour,
    degraded: degraded || undefined,
  };
}

export async function resolveContext(params: ResolveParams): Promise<GeoContext> {
  let lat: number | undefined;
  let lng: number | undefined;
  let city = 'Your city';
  let neighborhood: string | undefined;
  let country = '';
  let geoDegraded = false;

  if (params.location) {
    const geo = await getJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(params.location)}&count=1&language=en&format=json`,
    );
    const r = geo?.results?.[0];
    if (r) {
      lat = r.latitude;
      lng = r.longitude;
      city = r.name;
      country = (r.country_code ?? '').toUpperCase();
    } else {
      const fb = fallbackCity(params.location);
      lat = fb.lat; lng = fb.lng; city = fb.city; country = fb.country; geoDegraded = true;
    }
  } else if (params.lat != null && params.lng != null) {
    lat = params.lat;
    lng = params.lng;
    const nom = await getJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`,
    );
    const addr = nom?.address;
    if (addr) {
      neighborhood = addr.neighbourhood ?? addr.suburb ?? addr.quarter ?? addr.city_district;
      city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? 'Your city';
      country = (addr.country_code ?? '').toUpperCase();
    } else {
      geoDegraded = true;
    }
  } else {
    throw new Error('Provide lat/lng or location');
  }

  const weather = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`,
  );
  const cur = weather?.current;
  const weatherDegraded = !cur;

  return assemble({
    lat: lat!,
    lng: lng!,
    city,
    neighborhood,
    country,
    temperature: Math.round(cur?.temperature_2m ?? 66),
    condition: weatherCodeToCondition(cur?.weathercode ?? 1),
    localTime: cur?.time ?? new Date().toISOString(),
    degraded: geoDegraded || weatherDegraded,
  });
}
