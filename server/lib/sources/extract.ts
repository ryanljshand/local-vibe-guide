// Shared HTML → EventItem extraction for the scraper tier.
//
// The prototype only scraped event *names* (bare strings). We do much better:
// parse schema.org JSON-LD <script> blocks into structured events (title, start
// time, venue, address, geo, price, image, url), with a name-only regex as a
// fallback for pages without JSON-LD. This is the part that's deterministically
// unit-tested (the network fetch is environment-dependent).

import type { EventCategory, EventItem, EventSource } from '../types';
import { normalizeEventCategory } from '../events';

// ── fetch ────────────────────────────────────────────────────────────────────

export async function fetchHtml(url: string, timeoutMs = 4500): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LocalVibeGuide/1.0; +https://example.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

// ── small stable hash for ids ────────────────────────────────────────────────

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// ── JSON-LD parsing ──────────────────────────────────────────────────────────

/** Pull and JSON.parse every <script type="application/ld+json"> block (tolerant). */
export function parseJsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      // Some sites concatenate multiple objects or include trailing junk — try
      // to recover individual top-level {...} objects.
      for (const chunk of raw.split(/}\s*{/)) {
        const fixed = chunk.startsWith('{') ? chunk : `{${chunk}`;
        try {
          out.push(JSON.parse(fixed.endsWith('}') ? fixed : `${fixed}}`));
        } catch {
          /* give up on this chunk */
        }
      }
    }
  }
  return out;
}

function typeMatchesEvent(t: unknown): boolean {
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => typeof x === 'string' && /event/i.test(x));
}

/** Recursively collect every object that looks like a schema.org Event. */
export function collectEventNodes(node: unknown, acc: any[] = []): any[] {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    for (const n of node) collectEventNodes(n, acc);
    return acc;
  }
  const obj = node as Record<string, unknown>;
  if (obj['@type'] && typeMatchesEvent(obj['@type']) && typeof obj.name === 'string') {
    acc.push(obj);
  }
  // Walk common containers.
  for (const key of ['@graph', 'itemListElement', 'item', 'subEvent', 'events']) {
    if (obj[key]) collectEventNodes(obj[key], acc);
  }
  return acc;
}

const TYPE_TO_CATEGORY: Array<[RegExp, EventCategory]> = [
  [/music|concert|festival/i, 'music'],
  [/comedy/i, 'comedy'],
  [/dance|theater|theatre/i, 'theater'],
  [/screening|film/i, 'film'],
  [/food/i, 'food'],
  [/exhibition|visualarts|art/i, 'arts'],
  [/sports/i, 'sports'],
  [/social/i, 'community'],
];

function categoryFor(types: unknown, name: string): EventCategory {
  const arr = Array.isArray(types) ? types : [types];
  for (const t of arr) {
    if (typeof t !== 'string') continue;
    for (const [re, cat] of TYPE_TO_CATEGORY) if (re.test(t)) return cat;
  }
  return normalizeEventCategory(name);
}

function readLocation(loc: unknown): { venueName?: string; address?: string; lat?: number; lng?: number } {
  if (!loc) return {};
  if (typeof loc === 'string') return { venueName: loc };
  const arr = Array.isArray(loc) ? loc : [loc];
  const place = arr[0] as Record<string, any> | undefined;
  if (!place) return {};
  const addr = place.address;
  let address: string | undefined;
  if (typeof addr === 'string') address = addr;
  else if (addr && typeof addr === 'object')
    address = [addr.streetAddress, addr.addressLocality].filter(Boolean).join(', ') || undefined;
  const geo = place.geo;
  return {
    venueName: typeof place.name === 'string' ? place.name : undefined,
    address,
    lat: geo?.latitude != null ? Number(geo.latitude) : undefined,
    lng: geo?.longitude != null ? Number(geo.longitude) : undefined,
  };
}

function readPrice(offers: unknown): { priceMin?: number; priceMax?: number; isFree?: boolean } {
  if (!offers) return {};
  const arr = Array.isArray(offers) ? offers : [offers];
  const prices: number[] = [];
  for (const o of arr) {
    if (!o || typeof o !== 'object') continue;
    const cand = (o as any).price ?? (o as any).lowPrice;
    const n = typeof cand === 'string' ? parseFloat(cand.replace(/[^0-9.]/g, '')) : Number(cand);
    if (!Number.isNaN(n)) prices.push(n);
    const high = (o as any).highPrice;
    const hn = typeof high === 'string' ? parseFloat(high) : Number(high);
    if (!Number.isNaN(hn)) prices.push(hn);
  }
  if (!prices.length) return {};
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { priceMin: min, priceMax: max, isFree: max === 0 };
}

function firstString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  if (v && typeof v === 'object' && typeof (v as any).url === 'string') return (v as any).url;
  return undefined;
}

/** Map a JSON-LD Event node to our EventItem. Returns null if too thin to use. */
export function jsonLdToEventItem(node: any, source: EventSource, pageUrl?: string): EventItem | null {
  const title: string = (node.name ?? '').toString().trim();
  if (!title || title.length < 3) return null;
  const url = firstString(node.url) ?? pageUrl ?? '';
  const loc = readLocation(node.location);
  const price = readPrice(node.offers);
  return {
    id: `${source}_${hash(url || title)}`,
    title,
    description: typeof node.description === 'string' ? node.description.slice(0, 400) : undefined,
    category: categoryFor(node['@type'], title),
    start: typeof node.startDate === 'string' ? node.startDate : undefined,
    end: typeof node.endDate === 'string' ? node.endDate : undefined,
    venueName: loc.venueName,
    neighborhood: undefined,
    address: loc.address,
    lat: loc.lat,
    lng: loc.lng,
    priceMin: price.priceMin,
    priceMax: price.priceMax,
    isFree: price.isFree,
    imageUrl: firstString(node.image),
    url: url || pageUrl || 'https://example.com',
    source,
  };
}

/** Top-level helper: HTML → structured events via JSON-LD. */
export function extractJsonLdEvents(html: string, source: EventSource, pageUrl?: string): EventItem[] {
  const blocks = parseJsonLdBlocks(html);
  const nodes: any[] = [];
  for (const b of blocks) collectEventNodes(b, nodes);
  const items: EventItem[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    const item = jsonLdToEventItem(n, source, pageUrl);
    if (item && !seen.has(item.id)) {
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}

// ── name-only fallback (for pages without JSON-LD, e.g. Eventbrite search) ─────

function isLikelyEventName(name: string): boolean {
  if (!name || name.length < 6 || name.length > 120) return false;
  if (/^\d/.test(name)) return false;
  const generic = ['privacy', 'cookie', 'sign in', 'log in', 'help center', 'create event', 'browse'];
  const lower = name.toLowerCase();
  if (generic.some((g) => lower.includes(g))) return false;
  return true;
}

export function extractEventNamesFromJson(html: string, source: EventSource, limit = 8): EventItem[] {
  const names: string[] = [];
  for (const m of html.matchAll(/"name"\s*:\s*"([^"]{6,120})"/g)) {
    const name = m[1].replace(/\\u[\dA-Fa-f]{4}/g, (c) => String.fromCharCode(parseInt(c.slice(2), 16))).replace(/\\/g, '');
    if (isLikelyEventName(name)) names.push(name);
  }
  const unique = [...new Set(names)].slice(0, limit);
  return unique.map((title) => ({
    id: `${source}_${hash(title)}`,
    title,
    category: normalizeEventCategory(title),
    url: 'https://example.com',
    source,
  }));
}
