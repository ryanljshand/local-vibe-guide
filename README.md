# Local Vibe Guide

A local concierge that leads with **what's actually happening tonight**, not just
a list of bars. You tell it how you feel; it surfaces real, time-bound **events**
near you — a vinyl-only disco, a one-night gallery opening, a natural-wine popup —
and **pairs each one with nearby spots** to bookend the night (drinks before,
late-night bite after).

> **The event is the hero. The venue is the sidekick.** A great bar is already on
> Google Maps; a warehouse party isn't. This app is built around the stuff that's
> hard to find.

## How it works

1. **Locate** — GPS (down to the neighborhood) or type a city.
2. **Tune the voice** — pick your generation; copy is written to match (Gen Z →
   Boomer).
3. **Pick a mood** — the mood tiles are **derived from the events actually on
   tonight**, with a live count ("3 on").
4. **See the lineup** — real events, each with a paired venue, insider tips, and
   three Spotify playlist suggestions to set the mood.

## The recommendation engine

The Replit prototype asked the LLM to *be the database*, which produced generic,
repetitive, city-level results. This version treats the LLM as the **curator and
writer**, never the source of truth:

```
ingest events  →  rank for niche  →  allocate across moods  →  pair venues  →  LLM writes
 (many sources)   (hidden-gem first)  (NO repeats, by design)   (drinks/bite)   (voice + tips)
```

Three deliberate fixes for the prototype's failure modes:

- **Hyper-local, not city-level** — GPS is reverse-geocoded at *neighborhood*
  granularity, and that flows through to ranking and copy.
- **No repeats across moods** — every event is scored against every mood once and
  greedily assigned to **at most one** mood (`server/lib/allocate.ts`). Repetition
  is impossible by construction, not by shuffling.
- **Niche over popular** — a Bayesian-adjusted quality score with a "niche factor"
  that *rewards* loved-but-not-overrun and gently penalizes tourist magnets
  (`server/lib/ranking.ts`, `server/lib/events.ts`).

## Architecture

- **Frontend** — React + Vite + Tailwind + shadcn/ui (port 8080). Vite proxies
  `/api/*` to the backend.
- **Backend** — Express + TypeScript via `tsx` (port 3001). Stateless; data comes
  from event/venue providers + the LLM.

```
server/lib/
  sources/        event providers (the hero data): Ticketmaster + mock; RA/Dice/Luma/Eventbrite are stubbed seams
  places.ts       venue pairing (the sidekick): OSM (keyless) + mock
  events.ts       niche scoring, dedup across sites, mood derivation
  ranking.ts      Bayesian quality + niche factor
  allocate.ts     generic greedy no-repeat allocation
  geocode.ts      neighborhood-level context + weather (Open-Meteo / Nominatim)
  llm.ts          curator/writer — Claude → OpenAI → deterministic mock
  recommend.ts    orchestration
```

## Running it

Requires Node 20+ (or Bun). **It runs with zero keys** — no keys means realistic
mock events + deterministic copy, so the whole UX works offline.

```sh
npm install
npm run dev:all      # web (8080) + api (3001) together
# or run them separately: `npm run dev` and `npm run server`
```

### Going live

Copy `.env.example` to `.env` and add what you have — every key is optional and
upgrades a layer:

| Layer | Env | Source |
| --- | --- | --- |
| Writer (LLM) | `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) | auto-selects Claude → OpenAI → mock |
| Events (hero) | `TICKETMASTER_API_KEY` | free at developer.ticketmaster.com |
| Venues (pairing) | `PLACES_PROVIDER=osm` | OpenStreetMap, keyless |

The selectors fall back gracefully: no event key → mock events; LLM error → mock
copy; OSM empty → mock pairing. A "Sample mode" banner shows when only mocks ran.

> **Note on event coverage.** Ticketmaster covers mainstream/ticketed events. The
> genuinely niche tier (Resident Advisor, Dice, Luma, Eventbrite, local editorial)
> is wired as pluggable `EventProvider` seams in `server/lib/sources/` — add one by
> implementing the interface and registering it. Instagram/TikTok discovery has no
> usable API and is intentionally out of scope for now.

## Adding an event source

Implement `EventProvider` (`server/lib/sources/types.ts`) and add it to `PROVIDERS`
in `server/lib/sources/index.ts`. Normalization, niche scoring, cross-site dedup,
time-windowing, and allocation are handled for you.

## Tech stack

Vite · React · TypeScript · Tailwind · shadcn/ui · Express · TanStack Query · Vitest

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:all` | Web + API together |
| `npm run dev` / `npm run server` | Web / API individually |
| `npm run build` | Production build |
| `npm test` | Vitest (engine unit tests) |
| `npm run lint` | ESLint |
