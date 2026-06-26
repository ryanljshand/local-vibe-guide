// Ticketmaster Discovery API event source (first real provider).
//
// Free API key from https://developer.ticketmaster.com. Broad coverage of
// concerts / sports / arts / theater. Mainstream-skewing (it's mass ticketing),
// so the niche scorer correctly ranks it below RA/Dice/editorial — but it's the
// most reliable structured baseline and needs only a key.

import type { EventItem, EventSource } from '../types';
import { normalizeEventCategory } from '../events';
import type { EventProvider, FetchEventsParams } from './types';

const ENDPOINT = 'https://app.ticketmaster.com/discovery/v2/events.json';

export class TicketmasterProvider implements EventProvider {
  name: EventSource = 'ticketmaster';

  private key(): string | undefined {
    return process.env.TICKETMASTER_API_KEY;
  }
  enabled() {
    return !!this.key();
  }

  async fetch(params: FetchEventsParams): Promise<EventItem[]> {
    const key = this.key();
    if (!key) return [];

    const qs = new URLSearchParams({
      apikey: key,
      latlong: `${params.lat},${params.lng}`,
      radius: '15',
      unit: 'miles',
      startDateTime: `${params.localDate}T00:00:00Z`,
      sort: 'date,asc',
      size: '40',
    });

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${ENDPOINT}?${qs}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data: any = await res.json();
      const events: any[] = data?._embedded?.events ?? [];

      return events.map((e): EventItem => {
        const venue = e?._embedded?.venues?.[0];
        const seg = e?.classifications?.[0]?.segment?.name;
        const genre = e?.classifications?.[0]?.genre?.name;
        const priceRange = e?.priceRanges?.[0];
        return {
          id: `tm_${e.id}`,
          title: e.name,
          description: e.info ?? e.pleaseNote,
          category: normalizeEventCategory(`${seg ?? ''} ${genre ?? ''}`),
          start: e?.dates?.start?.dateTime ?? (e?.dates?.start?.localDate ? `${e.dates.start.localDate}T20:00:00` : undefined),
          venueName: venue?.name,
          neighborhood: venue?.city?.name,
          address: [venue?.address?.line1, venue?.city?.name].filter(Boolean).join(', '),
          lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
          lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
          priceMin: priceRange?.min,
          priceMax: priceRange?.max,
          imageUrl: e?.images?.find((i: any) => i.width > 600)?.url ?? e?.images?.[0]?.url,
          url: e.url,
          source: 'ticketmaster',
          // Ticketmaster events are inherently mainstream; signal high popularity.
          popularity: 0.8,
        };
      });
    } catch {
      return [];
    }
  }
}
