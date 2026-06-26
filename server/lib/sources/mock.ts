// Deterministic mock event source.
//
// Produces a realistic, varied set of *niche* events near the user so the whole
// app works with zero API keys and demos/tests are stable. Seeded by date+city
// so the same place on the same day always yields the same lineup.

import type { EventItem, EventCategory, EventSource } from '../types';
import type { EventProvider, FetchEventsParams } from './types';

function seeded(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface Template {
  title: string;
  category: EventCategory;
  source: EventSource;
  hour: number;
  price?: number;
  free?: boolean;
  blurb: string;
}

const TEMPLATES: Template[] = [
  { title: 'Vinyl-Only Disco at {hood} Warehouse', category: 'nightlife', source: 'ra', hour: 23, price: 15, blurb: 'All-night disco and Italo on a wall of speakers. No phones on the floor.' },
  { title: 'Natural Wine + Small Plates Popup', category: 'food', source: 'eventbrite', hour: 19, price: 45, blurb: 'A roving chef takes over a {hood} wine bar for one night of orange wine and snacks.' },
  { title: 'Basement Jazz Quartet', category: 'music', source: 'dice', hour: 21, price: 20, blurb: 'Intimate hard-bop set in a 40-seat room. Two sets, cash bar.' },
  { title: 'Risograph Zine Fair', category: 'market', source: 'editorial', hour: 12, free: true, blurb: 'Local illustrators and printmakers sell zines and prints in a {hood} gallery.' },
  { title: 'Experimental Film Screening + Q&A', category: 'film', source: 'editorial', hour: 20, price: 12, blurb: 'A restored 16mm program with the director in person.' },
  { title: 'Comedy in the Back of a Taco Shop', category: 'comedy', source: 'eventbrite', hour: 21, price: 10, blurb: 'BYO-laugh stand-up in an unlikely room. Lineup kept secret until you arrive.' },
  { title: 'Sound Bath Under the Dome', category: 'wellness', source: 'luma', hour: 18, price: 30, blurb: 'Gong and crystal-bowl session in a planetarium. Bring a mat.' },
  { title: 'Open Studios: {hood} Artists', category: 'arts', source: 'editorial', hour: 17, free: true, blurb: 'Twenty working studios open their doors. Wander, chat, buy direct.' },
  { title: 'Rooftop Cumbia Night', category: 'nightlife', source: 'ra', hour: 22, price: 18, blurb: 'Tropical bass and cumbia rebajada with the skyline behind the decks.' },
  { title: 'Midnight Ramen Residency', category: 'food', source: 'dice', hour: 23, price: 25, blurb: 'A cult noodle chef does a late-night counter takeover. Walk-ins only.' },
  { title: 'Queer Poetry Open Mic', category: 'community', source: 'meetup', hour: 19, free: true, blurb: 'Sign-ups at the door, five minutes each, fiercely supportive crowd.' },
  { title: 'Night Market by the River', category: 'market', source: 'editorial', hour: 18, free: true, blurb: 'Lantern-lit food stalls, makers, and a DJ until late along the water.' },
  { title: 'Indie Synth-Pop Triple Bill', category: 'music', source: 'dice', hour: 20, price: 22, blurb: 'Three rising bands, one sweaty room, merch table out back.' },
  { title: 'Full-Moon Trail Run', category: 'wellness', source: 'meetup', hour: 20, free: true, blurb: 'Headlamp 5k with a local run crew, drinks after at a {hood} pub.' },
];

const HOODS = ['Eastside', 'the Arts District', 'Old Town', 'the Mission', 'Northside', 'Riverfront', 'Uptown'];

export class MockEventProvider implements EventProvider {
  name: EventSource = 'mock';
  enabled() {
    return true;
  }
  async fetch(params: FetchEventsParams): Promise<EventItem[]> {
    const hoods = params.neighborhoods?.length ? params.neighborhoods : HOODS;
    const rand = seeded(`${params.city}:${params.localDate}`);
    // Pick ~9 of the templates for tonight, deterministically shuffled.
    const order = TEMPLATES.map((t, i) => ({ t, r: rand() + i * 1e-6 })).sort((a, b) => a.r - b.r);
    const chosen = order.slice(0, 9).map(({ t }) => t);

    return chosen.map((t, i): EventItem => {
      const hood = hoods[Math.floor(rand() * hoods.length)];
      const title = t.title.replace('{hood}', hood);
      const blurb = t.blurb.replace('{hood}', hood);
      const start = `${params.localDate}T${String(t.hour).padStart(2, '0')}:00:00`;
      // Scatter venues within ~3km of the user.
      const dLat = (rand() - 0.5) * 0.04;
      const dLng = (rand() - 0.5) * 0.05;
      return {
        id: `mock_${params.localDate}_${i}`,
        title,
        description: blurb,
        category: t.category,
        start,
        venueName: `${hood} ${t.category === 'food' ? 'Kitchen' : t.category === 'arts' ? 'Studio' : 'Hall'}`,
        neighborhood: hood,
        lat: params.lat + dLat,
        lng: params.lng + dLng,
        priceMin: t.free ? 0 : t.price,
        priceMax: t.free ? 0 : t.price,
        isFree: !!t.free,
        url: 'https://example.com/event',
        source: t.source,
      };
    });
  }
}
