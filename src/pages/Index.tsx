import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import ConciergeFlow from '@/components/ConciergeFlow';
import { useContext, type GeoContext } from '@/hooks/useActivities';

type GeoState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'manual'; city: string };

const AGE_BUCKETS = [
  { label: '18–27', emoji: '🌐', generation: 'Gen Z' },
  { label: '28–43', emoji: '📱', generation: 'Millennial' },
  { label: '44–59', emoji: '📺', generation: 'Gen X' },
  { label: '60+', emoji: '📻', generation: 'Boomer' },
];

export default function Index() {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [manualInput, setManualInput] = useState('');
  const [ctx, setCtx] = useState<GeoContext | null>(null);
  const [userAge, setUserAge] = useState<string | null>(null);

  const params =
    geo.status === 'granted'
      ? { lat: geo.lat, lng: geo.lng }
      : geo.status === 'manual'
      ? { location: geo.city }
      : null;

  const { data, isLoading, error } = useContext(params);

  const requestLocation = useCallback(() => {
    setGeo({ status: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: 'denied' }),
      { timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (geo.status === 'idle') requestLocation();
  }, [geo.status, requestLocation]);

  useEffect(() => {
    if (data) setCtx(data);
  }, [data]);

  const reset = useCallback(() => {
    setCtx(null);
    setUserAge(null);
    setManualInput('');
    setGeo({ status: 'idle' });
  }, []);

  if (ctx && userAge) {
    return <ConciergeFlow ctx={ctx} userAge={userAge} onReset={reset} />;
  }

  // Generation picker.
  if (ctx && !userAge) {
    return (
      <Shell>
        <p className="font-display text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
          One quick thing
        </p>
        <h1 className="font-display font-bold text-foreground text-2xl leading-tight">How should we talk to you?</h1>
        <p className="font-body text-muted-foreground text-sm mt-2">We'll match the tone to your vibe.</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {AGE_BUCKETS.map((b) => (
            <button
              key={b.label}
              onClick={() => setUserAge(b.generation)}
              className="bg-card border border-border/60 rounded-tile p-4 hover:border-primary hover:bg-primary/5 transition-all duration-150 text-left"
            >
              <span className="text-2xl block mb-2">{b.emoji}</span>
              <span className="font-display font-bold text-foreground text-base block">{b.label}</span>
              <span className="font-body text-muted-foreground text-xs">{b.generation}</span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  const loading = geo.status === 'requesting' || isLoading;

  return (
    <Shell>
      <p className="font-display text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-2">
        Local Vibe Guide
      </p>
      <h1 className="font-display font-bold text-foreground text-2xl md:text-3xl leading-tight">
        What's happening
        <br />
        <span className="text-primary">around you?</span>
      </h1>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-body text-muted-foreground text-sm">
            {geo.status === 'requesting' ? 'Finding your location…' : 'Reading your neighborhood…'}
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="py-4">
          <p className="font-body text-sm text-destructive mb-3">{(error as Error)?.message ?? 'Could not load context.'}</p>
          <button onClick={reset} className="font-body text-sm text-primary underline">
            Try again
          </button>
        </div>
      )}

      {(geo.status === 'denied' || (error && !loading)) && (
        <div className="space-y-4 mt-6">
          <p className="font-body text-sm text-muted-foreground">Enter your city or neighborhood:</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const city = manualInput.trim();
              if (city) setGeo({ status: 'manual', city });
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. Silver Lake, Los Angeles"
              className="flex-1 font-body text-sm bg-card border border-border/60 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="font-body text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:brightness-95 transition-all disabled:opacity-40"
            >
              Go
            </button>
          </form>
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 mx-auto font-body text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Use my location instead
          </button>
        </div>
      )}

      {geo.status === 'idle' && !loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground mt-6">
          <MapPin className="w-4 h-4" />
          <span className="font-body text-sm">Waiting for location…</span>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">{children}</div>
    </div>
  );
}
