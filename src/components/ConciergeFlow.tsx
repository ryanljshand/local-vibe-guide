import { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import {
  useSituations,
  useRecommend,
  type GeoContext,
  type Mood,
} from '@/hooks/useActivities';
import ContextBar from '@/components/ContextBar';
import VibeTileCard from '@/components/VibeTileCard';
import ActivityCard from '@/components/ActivityCard';

interface Props {
  ctx: GeoContext;
  userAge: string;
  onReset: () => void;
}

export default function ConciergeFlow({ ctx, userAge, onReset }: Props) {
  const situations = useSituations();
  const recommend = useRecommend();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  // Load situations once on mount.
  useEffect(() => {
    situations.mutate(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screen: 'situations' | 'activities' = selectedMood ? 'activities' : 'situations';

  const pickMood = (mood: Mood) => {
    setSelectedMood(mood);
    recommend.mutate({ ctx, moodId: mood.id, userAge });
  };

  const back = () => setSelectedMood(null);

  const data = situations.data;

  return (
    <div className="min-h-screen bg-background">
      <ContextBar ctx={ctx} />

      {/* Hero banner */}
      <div className="relative bg-card border-b border-border/40 px-4 py-6 text-center">
        {screen === 'activities' && (
          <button
            onClick={back}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {screen === 'situations' ? (
          <div>
            <p className="font-display text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-1">
              {data?.greeting ?? ctx.greeting}
            </p>
            <h1 className="font-display font-bold text-foreground text-xl md:text-2xl leading-snug">
              What's the move <span className="text-primary">tonight?</span>
            </h1>
            <p className="font-body text-muted-foreground text-sm mt-1">Pick a mood — these are built from what's actually on.</p>
          </div>
        ) : (
          <div>
            <p className="font-display text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-1">
              {selectedMood?.subtitle}
            </p>
            <h2 className="font-display font-bold text-foreground text-xl leading-snug">{selectedMood?.label}</h2>
            {recommend.data?.summary && (
              <p className="font-body text-muted-foreground text-sm mt-1">{recommend.data.summary}</p>
            )}
          </div>
        )}
      </div>

      {/* Sample-mode banner */}
      {data?.mockOnly && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
          <p className="text-xs font-body text-foreground/70 max-w-2xl mx-auto flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Sample events — add event-source API keys to surface real, live happenings near you.
          </p>
        </div>
      )}

      <div className="relative overflow-hidden">
        {/* Situations */}
        {screen === 'situations' && (
          <div className="slide-in-right max-w-4xl mx-auto px-4 py-6">
            {situations.isPending && <Centered>Reading the room…</Centered>}
            {situations.isError && (
              <ErrorBlock message={(situations.error as Error)?.message} onRetry={() => situations.mutate(ctx)} />
            )}
            {data && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 stagger">
                {data.moods.map((mood, i) => (
                  <VibeTileCard key={mood.id} mood={mood} onClick={() => pickMood(mood)} animDelay={i * 50} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activities */}
        {screen === 'activities' && (
          <div className="slide-in-right max-w-2xl mx-auto px-4 py-6">
            {recommend.isPending && <Centered>Pulling tonight's lineup + pairing the best spots…</Centered>}
            {recommend.isError && (
              <ErrorBlock
                message={(recommend.error as Error)?.message}
                onRetry={() => selectedMood && recommend.mutate({ ctx, moodId: selectedMood.id, userAge })}
              />
            )}
            {recommend.data && (
              <>
                <div className="flex flex-col gap-4 stagger">
                  {recommend.data.activities.map((act, i) => (
                    <ActivityCard key={act.id} activity={act} animDelay={i * 100} />
                  ))}
                </div>
                {recommend.data.activities.length === 0 && (
                  <Centered>Nothing in this mood tonight — try another.</Centered>
                )}
                <div className="mt-8 text-center">
                  <button
                    onClick={onReset}
                    className="font-body text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Start over — different place or vibe
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
      <p className="font-body text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="font-body text-sm text-destructive mb-3">{message ?? 'Something went wrong.'}</p>
      <button onClick={onRetry} className="font-body text-sm text-primary underline">
        Try again
      </button>
    </div>
  );
}
