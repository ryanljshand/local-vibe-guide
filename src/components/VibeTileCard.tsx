import type { Mood } from '@/hooks/useActivities';
import { MOOD_VISUALS } from '@/lib/moods';

interface VibeTileCardProps {
  mood: Mood;
  onClick: () => void;
  animDelay?: number;
}

export default function VibeTileCard({ mood, onClick, animDelay = 0 }: VibeTileCardProps) {
  const visual = MOOD_VISUALS[mood.kind];
  return (
    <button
      onClick={onClick}
      className="fade-up group relative flex flex-col items-center text-center w-full rounded-tile overflow-hidden shadow-tile hover:shadow-tile-hover transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] cursor-pointer"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className={`relative w-full aspect-square ${visual.bg} flex items-center justify-center`}>
        <span className="text-5xl select-none transition-transform group-hover:scale-110">{visual.emoji}</span>
        {mood.eventCount > 0 && (
          <span className="absolute top-2 right-2 text-[11px] font-body font-semibold bg-card/90 text-foreground px-2 py-0.5 rounded-full shadow-card">
            {mood.eventCount} on
          </span>
        )}
      </div>
      <div className="w-full bg-card px-3 py-3 border-t border-border/30">
        <p className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {mood.label}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-tight line-clamp-1 italic">
          {mood.subtitle}
        </p>
      </div>
    </button>
  );
}
