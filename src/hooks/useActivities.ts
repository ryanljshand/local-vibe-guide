import { useMutation, useQuery } from '@tanstack/react-query';

export interface GeoContext {
  greeting: string;
  city: string;
  neighborhood?: string;
  location: string;
  lat: number;
  lng: number;
  temperature: number;
  condition: string;
  timeOfDay: string;
  dayOfWeek: string;
  localDate: string;
  localHour: number;
  degraded?: boolean;
}

export type MoodKind =
  | 'be_social'
  | 'eat_drink'
  | 'slow_down'
  | 'get_moving'
  | 'arts_culture'
  | 'explore_outside';

export interface Mood {
  id: string;
  kind: MoodKind;
  label: string;
  subtitle: string;
  eventCount: number;
}

export interface SituationsResponse {
  greeting: string;
  moods: Mood[];
  sourcesUsed: string[];
  mockOnly: boolean;
  llmProvider: string;
}

export interface ActivityPlaylist {
  query: string;
  mood: string;
}

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
  sourceLabel?: string;
  url?: string;
  playlists: ActivityPlaylist[];
  lat?: number;
  lng?: number;
}

export interface RecommendResponse {
  summary: string;
  activities: Activity[];
}

const BASE = '/api/activities';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Request failed (${res.status})`);
  return res.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Request failed (${res.status})`);
  return res.json();
}

export function useContext(params: { lat?: number; lng?: number; location?: string } | null) {
  return useQuery({
    queryKey: ['context', params],
    enabled: !!params,
    retry: 0,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params!.lat != null) qs.set('lat', String(params!.lat));
      if (params!.lng != null) qs.set('lng', String(params!.lng));
      if (params!.location) qs.set('location', params!.location);
      return getJson<GeoContext>(`${BASE}/context?${qs}`);
    },
  });
}

export function useSituations() {
  return useMutation({
    mutationFn: (ctx: GeoContext) => postJson<SituationsResponse>(`${BASE}/situations`, ctx),
  });
}

export function useRecommend() {
  return useMutation({
    mutationFn: (args: { ctx: GeoContext; moodId: string; userAge: string }) =>
      postJson<RecommendResponse>(`${BASE}/recommend`, { ...args.ctx, moodId: args.moodId, userAge: args.userAge }),
  });
}
