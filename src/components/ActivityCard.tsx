import { type Activity } from '@/data/vibes';
import { MapPin, Clock } from 'lucide-react';

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
      {/* Photo */}
      <div className="relative w-full h-44 overflow-hidden">
        <img
          src={activity.image}
          alt={activity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex gap-1.5 flex-wrap">
            {activity.tags.map(tag => (
              <span key={tag} className="text-[11px] font-body font-semibold bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-bold text-foreground text-base leading-tight">
          {activity.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground font-body italic leading-snug">
          {activity.tagline}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-accent" />
            {activity.neighborhood}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-accent" />
            {activity.walkTime} walk
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground/70 font-body">
          {activity.address}
        </p>
      </div>
    </div>
  );
}
