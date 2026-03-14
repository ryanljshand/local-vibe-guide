import { useState, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { vibeData, type VibeTile, type SubVibeTile } from '@/data/vibes';
import { type ConciergeContext, getTimeLabel } from '@/lib/concierge';
import ContextBar from '@/components/ContextBar';
import VibeTileCard from '@/components/VibeTileCard';
import ActivityCard from '@/components/ActivityCard';

type Screen = 'vibes' | 'subvibes' | 'activities';

interface Props {
  ctx: ConciergeContext;
}

export default function ConciergeFlow({ ctx }: Props) {
  const [screen, setScreen] = useState<Screen>('vibes');
  const [selectedVibe, setSelectedVibe] = useState<VibeTile | null>(null);
  const [selectedSubVibe, setSelectedSubVibe] = useState<SubVibeTile | null>(null);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');

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

  const handleBack = useCallback(() => {
    if (screen === 'activities') {
      goTo('subvibes', 'left');
      setSelectedSubVibe(null);
    } else if (screen === 'subvibes') {
      goTo('vibes', 'left');
      setSelectedVibe(null);
    }
  }, [screen, goTo]);

  const animClass = slideDir === 'right' ? 'slide-in-right' : 'slide-in-left';

  const timeLabel = getTimeLabel(ctx.timeOfDay);
  const day = ctx.dayName;

  return (
    <div className="min-h-screen bg-background">
      <ContextBar ctx={ctx} />

      {/* Hero concierge banner */}
      <div className="bg-card border-b border-border/40 px-4 py-6 text-center">
        {(screen === 'subvibes' || screen === 'activities') && (
          <button
            onClick={handleBack}
            className="absolute left-4 mt-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
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
      </div>
    </div>
  );
}
