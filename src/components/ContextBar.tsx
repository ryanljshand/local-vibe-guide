import type { GeoContext } from '@/hooks/useActivities';

const CONDITION_EMOJI: Record<string, string> = {
  clear: '☀️',
  'partly cloudy': '⛅',
  cloudy: '☁️',
  foggy: '🌫️',
  rainy: '🌧️',
  snowy: '❄️',
  stormy: '⛈️',
};

interface ContextBarProps {
  ctx: GeoContext;
}

export default function ContextBar({ ctx }: ContextBarProps) {
  const place = ctx.neighborhood ? `${ctx.neighborhood}, ${ctx.city}` : ctx.city;
  return (
    <div className="context-bar sticky top-0 z-50 w-full bg-card border-b border-border/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-10 flex items-center gap-3 text-sm font-body">
        <span className="flex items-center gap-1.5 text-accent font-semibold">
          <span>{CONDITION_EMOJI[ctx.condition] ?? '📍'}</span>
          <span className="capitalize">{ctx.condition}</span>
        </span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">{ctx.temperature}°F</span>
        <span className="text-border hidden sm:inline">·</span>
        <span className="text-muted-foreground truncate hidden sm:inline">{place}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">{ctx.degraded ? 'Sample mode' : 'Live context'}</span>
        </div>
      </div>
    </div>
  );
}
