import { useState, useCallback } from 'react';
import { ChevronLeft, Heart } from 'lucide-react';
import { vibeData, getActivitiesByIds, type VibeTile, type SubVibeTile } from '@/data/vibes';
import { type ConciergeContext, getTimeLabel } from '@/lib/concierge';
import { useFavorites } from '@/hooks/use-favorites';
import ContextBar from '@/components/ContextBar';
import VibeTileCard from '@/components/VibeTileCard';
import ActivityCard from '@/components/ActivityCard';

type Screen = 'vibes' | 'subvibes' | 'activities' | 'saved';

interface Props {
  ctx: ConciergeContext;
}

export default function ConciergeFlow({ ctx }: Props) {
  const [screen, setScreen] = useState<Screen>('vibes');
  const [prevScreen, setPrevScreen] = useState<Screen>('vibes');
  const [selectedVibe, setSelectedVibe] = useState<VibeTile | null>(null);
  const [selectedSubVibe, setSelectedSubVibe] = useState<SubVibeTile | null>(null);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');

  const { favorites } = useFavorites();
  const savedActivities = getActivitiesByIds(favorites);

  const goTo = useCallback((next: Screen, dir: 'right' | 'left' = 'right') => {
    setSlideDir(dir);
    setScreen(next);
  }, []);

  const handleVibeSelect = useCallback((vibe: VibeTile) => {
    setSelectedVibe(vibe);
    goTo('subvibes', 'right');
  }, [goTo]);

  const handleSubVibeSelect = useCallback((sub: SubVibeTile) => {
    setSelectedSubVibe(sub);
    goTo('activities', 'right');
  }, [goTo]);

  const openSaved = useCallback(() => {
    setPrevScreen(screen);
    goTo('saved', 'right');
  }, [screen, goTo]);

  const handleBack = useCallback(() => {
    if (screen === 'saved') {
      goTo(prevScreen, 'left');
    } else if (screen === 'activities') {
      goTo('subvibes', 'left');
      setSelectedSubVibe(null);
    } else if (screen === 'subvibes') {
      goTo('vibes', 'left');
      setSelectedVibe(null);
    }
  }, [screen, prevScreen, goTo]);

  const animClass = slideDir === 'right' ? 'slide-in-right' : 'slide-in-left';

  const timeLabel = getTimeLabel(ctx.timeOfDay);
  const day = ctx.dayName;
  const showBack = screen !== 'vibes';

  return (
    <div className="min-h-screen bg-background">
      <ContextBar ctx={ctx} />

      {/* Hero concierge banner */}
      <div className="relative bg-card border-b border-border/40 px-4 py-6 text-center">
        {showBack && (
          <button
            onClick={handleBack}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Saved shortcut */}
        {screen !== 'saved' && (
          <button
            onClick={openSaved}
            aria-label={`View saved spots${savedActivities.length ? ` (${savedActivities.length})` : ''}`}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Heart className={`w-4 h-4 ${savedActivities.length ? 'fill-primary text-primary' : ''}`} />
            <span className="hidden sm:inline">Saved</span>
            {savedActivities.length > 0 && (
              <span className="font-semibold text-foreground">{savedActivities.length}</span>
            )}
          </button>
        )}

        {screen === 'vibes' && (
          <div>
            <p className="font-display text-muted-foreground text-sm font-semibold uppercase tracking-widest mb-1">
              Your concierge
            </p>
            <h1 className="font-display font-bold text-foreground text-xl md:text-2xl leading-snug">
              It's a {day.toLowerCase()} {timeLabel} in{' '}
              <span className="text-primary">{ctx.city}</span>.
            </h1>
            <p className="font-display font-semibold text-foreground/70 text-lg md:text-xl mt-1">
              You feel like…
            </p>
          </div>
        )}
        {screen === 'subvibes' && selectedVibe && (
          <div>
            <p className="font-display text-muted-foreground text-sm font-semibold uppercase tracking-widest mb-1">
              Nice. How exactly?
            </p>
            <h2 className="font-display font-bold text-foreground text-xl leading-snug">
              {selectedVibe.label}
            </h2>
            <p className="font-body text-muted-foreground text-sm mt-1">
              Pick your vibe
            </p>
          </div>
        )}
        {screen === 'activities' && selectedSubVibe && (
          <div>
            <p className="font-display text-muted-foreground text-sm font-semibold uppercase tracking-widest mb-1">
              Perfect. Here are your spots.
            </p>
            <h2 className="font-display font-bold text-foreground text-xl leading-snug">
              {selectedSubVibe.label}
            </h2>
            <p className="font-body text-muted-foreground text-sm mt-1">
              {selectedSubVibe.activities.length} places nearby
            </p>
          </div>
        )}
        {screen === 'saved' && (
          <div>
            <p className="font-display text-muted-foreground text-sm font-semibold uppercase tracking-widest mb-1">
              Your shortlist
            </p>
            <h2 className="font-display font-bold text-foreground text-xl leading-snug">
              Saved spots
            </h2>
            <p className="font-body text-muted-foreground text-sm mt-1">
              {savedActivities.length === 0
                ? 'Nothing saved yet'
                : `${savedActivities.length} place${savedActivities.length === 1 ? '' : 's'} to come back to`}
            </p>
          </div>
        )}
      </div>

      {/* Screen content */}
      <div className="relative overflow-hidden">
        {screen === 'vibes' && (
          <div key="vibes" className={`${animClass} max-w-4xl mx-auto px-4 py-6`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger">
              {vibeData.map((vibe, i) => (
                <VibeTileCard
                  key={vibe.id}
                  label={vibe.label}
                  sublabel={vibe.sublabel}
                  icon={vibe.icon}
                  color={vibe.color}
                  onClick={() => handleVibeSelect(vibe)}
                  animDelay={i * 50}
                />
              ))}
            </div>
          </div>
        )}

        {screen === 'subvibes' && selectedVibe?.subVibes && (
          <div key="subvibes" className={`${animClass} max-w-4xl mx-auto px-4 py-6`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
              {selectedVibe.subVibes.map((sub, i) => (
                <VibeTileCard
                  key={sub.id}
                  label={sub.label}
                  icon={sub.icon}
                  color={sub.color}
                  onClick={() => handleSubVibeSelect(sub)}
                  animDelay={i * 80}
                />
              ))}
            </div>
          </div>
        )}

        {screen === 'activities' && selectedSubVibe && (
          <div key="activities" className={`${animClass} max-w-2xl mx-auto px-4 py-6`}>
            <div className="flex flex-col gap-4 stagger">
              {selectedSubVibe.activities.map((act, i) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  animDelay={i * 100}
                />
              ))}
            </div>

            {/* Start over */}
            <div className="mt-8 text-center">
              <button
                onClick={() => { setSelectedVibe(null); setSelectedSubVibe(null); goTo('vibes', 'left'); }}
                className="font-body text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                Start over — show me something different
              </button>
            </div>
          </div>
        )}

        {screen === 'saved' && (
          <div key="saved" className={`${animClass} max-w-2xl mx-auto px-4 py-6`}>
            {savedActivities.length > 0 ? (
              <div className="flex flex-col gap-4 stagger">
                {savedActivities.map((act, i) => (
                  <ActivityCard key={act.id} activity={act} animDelay={i * 100} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-full bg-secondary">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-display font-semibold text-foreground text-lg">
                  No saved spots yet
                </p>
                <p className="font-body text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                  Tap the heart on any place to keep it here for later.
                </p>
                <button
                  onClick={() => goTo('vibes', 'left')}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm px-5 py-2.5 hover:brightness-95 active:scale-[0.98] transition-all"
                >
                  Find something nearby
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
