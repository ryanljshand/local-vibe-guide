import { getWeatherEmoji, getWeatherLabel, type ConciergeContext } from '@/lib/concierge';

interface ContextBarProps {
  ctx: ConciergeContext;
}

export default function ContextBar({ ctx }: ContextBarProps) {
  return (
    <div className="context-bar sticky top-0 z-50 w-full bg-card border-b border-border/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-10 flex items-center gap-3 text-sm font-body">
        <span className="flex items-center gap-1.5 text-accent font-semibold">
          <span>{getWeatherEmoji(ctx.weather)}</span>
          <span>{getWeatherLabel(ctx.weather)}</span>
        </span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">{ctx.tempF}°F</span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">{ctx.neighborhood}</span>
        <span className="text-border">·</span>
        <span className="text-muted-foreground">{ctx.city}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Live context</span>
        </div>
      </div>
    </div>
  );
}
