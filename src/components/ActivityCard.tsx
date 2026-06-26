import { MapPin, Clock, Zap, Star, Navigation } from 'lucide-react';
import type { Activity } from '@/hooks/useActivities';
import { categoryBg } from '@/lib/moods';

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="#1DB954" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function directionsUrl(a: Activity): string {
  const q = [a.venueName, a.address, a.neighborhood].filter(Boolean).join(', ') || a.title;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

interface ActivityCardProps {
  activity: Activity;
  animDelay?: number;
}

export default function ActivityCard({ activity, animDelay = 0 }: ActivityCardProps) {
  return (
    <div
      className="fade-up bg-card rounded-tile overflow-hidden shadow-card hover:shadow-tile transition-all duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Hero strip — the event */}
      <div className={`relative w-full h-28 overflow-hidden ${categoryBg(activity.category)} flex items-center justify-center`}>
        <span className="text-5xl select-none">{activity.emoji}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-body font-semibold bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full capitalize">
            {activity.category}
          </span>
          {activity.isLocalEvent && (
            <span className="text-[11px] font-body font-semibold bg-accent/90 text-accent-foreground px-2 py-0.5 rounded-full">
              Happening tonight
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-bold text-foreground text-base leading-tight">{activity.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground font-body italic leading-snug">{activity.description}</p>

        {activity.specialNote && (
          <div className="mt-2.5 flex items-start gap-1.5 bg-primary/10 border border-primary/30 rounded-lg px-2.5 py-1.5">
            <Star className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11.5px] text-primary font-body font-medium leading-snug">{activity.specialNote}</p>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-accent shrink-0" />
            <span className="truncate">
              {activity.venueName}
              {activity.neighborhood ? ` · ${activity.neighborhood}` : ''}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-accent shrink-0" />
            {activity.duration}
            <span className="mx-1 text-muted-foreground/40">·</span>
            <Zap className="w-3 h-3 text-accent shrink-0" />
            {activity.energyLevel} energy
          </span>
        </div>

        {/* Pairings + tips */}
        {activity.tips?.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {activity.tips.map((tip, i) => (
              <li key={i} className="text-[12px] text-foreground/80 font-body flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">›</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Playlists */}
        {activity.playlists?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Set the mood
            </p>
            <div className="flex flex-col gap-0.5">
              {activity.playlists.slice(0, 3).map((pl, i) => (
                <a
                  key={i}
                  href={`https://open.spotify.com/search/${encodeURIComponent(pl.query)}/playlists`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors group"
                >
                  <SpotifyIcon />
                  <span className="text-[12px] text-foreground/80 group-hover:text-foreground truncate flex-1">{pl.query}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{pl.mood}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <a
          href={directionsUrl(activity)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm px-4 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
        >
          <Navigation className="w-4 h-4" />
          Get directions
        </a>
      </div>
    </div>
  );
}
