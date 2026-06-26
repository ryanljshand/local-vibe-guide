# Local Vibe Guide

Your city, by the mood you're in.

Local Vibe Guide is a small concierge web app that flips the usual "search for a
place" model on its head. Instead of typing what you want, you tell it **how you
feel** — _"getting a caffeine fix"_, _"hiding from the rain"_, _"eating something
amazing"_ — and it walks you down to a hand-picked shortlist of nearby spots that
match the moment, the weather, and the time of day.

The interaction is inspired by [Songza](https://en.wikipedia.org/wiki/Songza)'s
old "concierge" flow: a few warm, opinionated taps instead of a blank search box.

## How it works

1. **Pick a vibe** — eight mood tiles, framed by a live context bar (city,
   neighborhood, weather, temperature, time of day).
2. **Narrow it down** — each vibe fans out into a couple of sub-vibes
   (e.g. _a cozy corner cafe_ vs. _quick grab and go_).
3. **See your spots** — a curated set of real local places, each with a tagline,
   tags, walk time, and address.

From any spot you can:

- **Get directions** — opens the location in Google Maps.
- **Save it** — heart a place to keep it on your shortlist (persisted in
  `localStorage`, synced across tabs). Revisit everything from the **Saved** view.
- **Share it** — uses the native Web Share sheet, with a clipboard fallback.

The current dataset is Portland, OR. Swapping in another city is just editing
[`src/data/vibes.ts`](src/data/vibes.ts) and the context in
[`src/pages/Index.tsx`](src/pages/Index.tsx).

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/) + Testing Library

## Project structure

```
src/
  components/
    ConciergeFlow.tsx   # the 3-step vibes → sub-vibes → spots flow + Saved view
    ContextBar.tsx      # live weather/location strip
    VibeTileCard.tsx    # the mood/sub-vibe tiles
    ActivityCard.tsx    # a spot, with directions / save / share actions
  data/vibes.ts         # the dataset + lookup helpers
  hooks/use-favorites.ts# localStorage-backed saved-spots store
  lib/concierge.ts      # time-of-day / weather helpers
  pages/Index.tsx       # wires the context and renders the flow
```

## Getting started

Requires [Node.js](https://nodejs.org/) (or [Bun](https://bun.sh/)).

```sh
# Install dependencies
npm install

# Start the dev server with hot reload
npm run dev
```

## Scripts

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start the Vite dev server             |
| `npm run build`    | Production build to `dist/`           |
| `npm run preview`  | Preview the production build          |
| `npm run lint`     | Run ESLint                            |
| `npm test`         | Run the Vitest suite once             |
| `npm run test:watch` | Run Vitest in watch mode            |
