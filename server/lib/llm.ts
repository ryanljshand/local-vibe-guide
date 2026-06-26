// LLM layer — the LLM is the CURATOR/WRITER, never the source of venues/events.
//
// It receives real events (+ real paired venues) and writes the voice-matched
// copy, tips, and playlist queries. It cannot invent a venue: all factual fields
// (venueName, address, category, time) are filled by the server from source data.
//
// Provider is pluggable: Claude (default) → OpenAI → deterministic mock fallback,
// so the app runs and is testable with zero keys.

import type { Activity, EventItem, GeoContext, Mood, VenuePairing } from './types';
import { sourceLabelOf } from './events';

export interface EventWithPairings {
  event: EventItem;
  pairings: VenuePairing[];
}

export interface WriteInput {
  ctx: GeoContext;
  mood: Mood;
  generation: string;
  items: EventWithPairings[];
}

type Provider = 'anthropic' | 'openai' | 'mock';

function selectProvider(): Provider {
  const forced = process.env.LLM_PROVIDER as Provider | undefined;
  if (forced) return forced;
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

export function activeLlmProvider(): Provider {
  return selectProvider();
}

function generationVoice(generation: string): string {
  switch (generation) {
    case 'Gen Z':
      return 'Write for Gen Z (18–27): natural, lightly ironic slang ("lowkey", "it\'s giving", "no cap") — sparingly, not every line. Short and punchy.';
    case 'Millennial':
      return 'Write for Millennials (28–43): warm, a little self-deprecating about adulting, enthusiastic but not cringe. No Gen Z slang.';
    case 'Gen X':
      return 'Write for Gen X (44–59): dry, direct, sardonic, "trust me on this." No slang, no emoji in prose.';
    case 'Boomer':
      return 'Write for Boomers (60+): clear, warm, respectful, full sentences. Mention practical details (parking, noise). No slang.';
    default:
      return 'Write as a friendly, enthusiastic local insider. Conversational and clear.';
  }
}

const EMOJI_BY_CATEGORY: Record<string, string> = {
  music: '🎧', nightlife: '🪩', arts: '🎨', theater: '🎭', comedy: '🎤', film: '🎬',
  food: '🍜', market: '🛍️', community: '🫶', sports: '🏟️', wellness: '🧘', outdoor: '🌲',
};

function energyForCategory(cat: string): Activity['energyLevel'] {
  if (['nightlife', 'music', 'sports'].includes(cat)) return 'High';
  if (['community', 'wellness', 'film'].includes(cat)) return 'Low';
  return 'Medium';
}

function playlistsForCategory(cat: string): Activity['playlists'] {
  const map: Record<string, Activity['playlists']> = {
    nightlife: [{ query: 'peak time warehouse techno', mood: 'High Energy' }, { query: 'italo disco classics', mood: 'Groovy' }, { query: 'after hours deep house', mood: 'Late Night' }],
    music: [{ query: 'indie live set warmup', mood: 'Build Up' }, { query: 'support act discoveries', mood: 'Fresh' }, { query: 'encore singalongs', mood: 'Euphoric' }],
    food: [{ query: 'dinner party soul', mood: 'Warm' }, { query: 'natural wine bar jazz', mood: 'Smooth' }, { query: 'late night kitchen funk', mood: 'Groovy' }],
    arts: [{ query: 'gallery opening ambient', mood: 'Cerebral' }, { query: 'art walk downtempo', mood: 'Chill' }, { query: 'studio session lo-fi', mood: 'Focused' }],
    wellness: [{ query: 'sound bath drone', mood: 'Calm' }, { query: 'slow flow ambient', mood: 'Grounding' }, { query: 'evening wind down', mood: 'Soft' }],
  };
  return map[cat] ?? [
    { query: `${cat} night out`, mood: 'Upbeat' },
    { query: `${cat} chill mix`, mood: 'Easy' },
    { query: `${cat} late set`, mood: 'Moody' },
  ];
}

/** Build the factual scaffold for an activity from real source data. */
function scaffold(item: EventWithPairings): Activity {
  const e = item.event;
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    venueName: e.venueName ?? 'TBA',
    neighborhood: e.neighborhood,
    address: e.address,
    category: e.category,
    duration: e.start ? 'Tonight' : 'Ongoing',
    energyLevel: energyForCategory(e.category),
    emoji: EMOJI_BY_CATEGORY[e.category] ?? '✨',
    tips: [],
    isLocalEvent: true,
    specialNote: null,
    sourceLabel: sourceLabelOf(e),
    url: e.url,
    playlists: playlistsForCategory(e.category),
    rating: undefined,
    reviewCount: undefined,
    lat: e.lat,
    lng: e.lng,
  };
}

function pairingTip(p: VenuePairing): string {
  const when = p.kind === 'before' ? 'Before:' : p.kind === 'after' ? 'After:' : 'Nearby:';
  const rate = p.rating ? ` (${p.rating}★)` : '';
  return `${when} ${p.venueName}${rate}`;
}

// ─── Mock writer (deterministic, no network) ────────────────────────────────

function mockWrite(input: WriteInput): Activity[] {
  return input.items.map((item) => {
    const a = scaffold(item);
    const e = item.event;
    const price = e.isFree ? 'Free' : e.priceMax ? `~$${e.priceMax}` : '';
    a.description = e.description || `A ${e.category} happening in ${e.neighborhood ?? input.ctx.city} tonight.`;
    a.tips = [
      ...item.pairings.map(pairingTip),
      price ? `Cover: ${price}` : 'Check the door time before you go',
    ].slice(0, 2);
    if (e.source === 'ra' || e.source === 'dice' || e.source === 'editorial') {
      a.specialNote = 'The kind of night you only hear about if you know where to look.';
    }
    return a;
  });
}

// ─── Real LLM writer ─────────────────────────────────────────────────────────

function buildPrompt(input: WriteInput): string {
  const { ctx, mood, generation, items } = input;
  const itemsBlock = items
    .map((it, i) => {
      const e = it.event;
      const pairs = it.pairings.map((p) => `${p.kind}: ${p.venueName} (${p.category}${p.rating ? `, ${p.rating}★` : ''})`).join('; ');
      return `[${i}] id="${e.id}"
  title: ${e.title}
  category: ${e.category} | source: ${e.source} | when: ${e.start ?? 'ongoing'} | price: ${e.isFree ? 'free' : e.priceMax ?? '?'}
  venue: ${e.venueName ?? 'TBA'}${e.neighborhood ? `, ${e.neighborhood}` : ''}
  blurb: ${e.description ?? '(none)'}
  pair-with: ${pairs || '(none)'}`;
    })
    .join('\n');

  return `You are a hyper-local nightlife/culture concierge for ${ctx.location}.
Local context: ${ctx.greeting} It is ${ctx.dayOfWeek} ${ctx.timeOfDay}, ${ctx.temperature}°F, ${ctx.condition}.
The user is in the mood: "${mood.label}" — ${mood.subtitle}.

${generationVoice(generation)}

These are REAL events happening tonight (the hero of each card) with REAL nearby venues to pair with them. Do NOT invent venues, events, times, or prices — use only what's given. Write the vibe, not new facts.

EVENTS:
${itemsBlock}

For EACH event, return an object with:
- id: the exact id given
- title: keep the real event name, but you may add a short vivid hook
- description: 2 sentences — what the night is and why it's worth leaving the house for, in the right voice
- tips: exactly 2 short insider tips (< 12 words each). Use the pairing venues by name when given (e.g. "Drinks first at X").
- energyLevel: "Low" | "Medium" | "High"
- emoji: one fitting emoji
- specialNote: one sentence on why it's special if it's a niche/underground find, else null
- playlists: exactly 3 { "query": "<specific Spotify search, 3-6 words>", "mood": "<2-3 word energy label>" }, tonally varied

Respond with ONLY valid JSON: { "activities": [ ... ] }`;
}

async function callAnthropic(prompt: string): Promise<any> {
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      messages: [{ role: 'user', content: `${prompt}\n\nReturn ONLY the JSON object.` }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data: any = await res.json();
  const text = data?.content?.find((c: any) => c.type === 'text')?.text ?? '{}';
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
}

async function callOpenAI(prompt: string): Promise<any> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data: any = await res.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? '{}');
}

/** Merge LLM copy onto the factual scaffold (scaffold wins on facts). */
function merge(input: WriteInput, llmActivities: any[]): Activity[] {
  const byId = new Map<string, any>();
  for (const a of llmActivities ?? []) if (a?.id) byId.set(String(a.id), a);

  return input.items.map((item) => {
    const base = scaffold(item);
    const w = byId.get(base.id);
    if (!w) {
      // LLM skipped this one — fall back to mock copy for it.
      return mockWrite({ ...input, items: [item] })[0];
    }
    return {
      ...base,
      title: typeof w.title === 'string' && w.title.trim() ? w.title : base.title,
      description: typeof w.description === 'string' ? w.description : base.description,
      tips: Array.isArray(w.tips) ? w.tips.slice(0, 2).map(String) : base.tips,
      energyLevel: ['Low', 'Medium', 'High'].includes(w.energyLevel) ? w.energyLevel : base.energyLevel,
      emoji: typeof w.emoji === 'string' ? w.emoji : base.emoji,
      specialNote: typeof w.specialNote === 'string' ? w.specialNote : base.specialNote,
      playlists: Array.isArray(w.playlists) && w.playlists.length
        ? w.playlists.slice(0, 3).map((p: any) => ({ query: String(p.query ?? p.name ?? ''), mood: String(p.mood ?? '') }))
        : base.playlists,
    };
  });
}

export async function writeActivities(input: WriteInput): Promise<Activity[]> {
  if (!input.items.length) return [];
  const provider = selectProvider();
  if (provider === 'mock') return mockWrite(input);

  try {
    const prompt = buildPrompt(input);
    const json = provider === 'anthropic' ? await callAnthropic(prompt) : await callOpenAI(prompt);
    return merge(input, json?.activities ?? []);
  } catch (err) {
    console.error('[llm] falling back to mock:', (err as Error)?.message);
    return mockWrite(input);
  }
}
