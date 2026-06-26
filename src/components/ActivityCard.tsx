import { type Activity } from '@/data/vibes';
import { MapPin, Clock, Heart, Navigation, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/use-favorites';

interface ActivityCardProps {
  activity: Activity;
  animDelay?: number;
}

function directionsUrl(activity: Activity): string {
  const query = `${activity.name}, ${activity.address}, ${activity.neighborhood}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function ActivityCard({ activity, animDelay = 0 }: ActivityCardProps) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(activity.id);

  const handleShare = async () => {
    const shareData = {
      title: activity.name,
      text: `${activity.name} — ${activity.tagline} (${activity.address}, ${activity.neighborhood})`,
      url: directionsUrl(activity),
    };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('Copied to clipboard', { description: activity.name });
    } catch (err) {
      // User cancelling the native share sheet throws AbortError — that's not an error worth surfacing.
      if ((err as Error)?.name !== 'AbortError') {
        toast.error("Couldn't share that spot");
      }
    }
  };

  const handleSave = () => {
    toggle(activity.id);
    toast(saved ? 'Removed from saved' : 'Saved', { description: activity.name });
  };

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

        {/* Save toggle */}
        <button
          onClick={handleSave}
          aria-label={saved ? `Remove ${activity.name} from saved` : `Save ${activity.name}`}
          aria-pressed={saved}
          className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:scale-105 active:scale-95 transition-transform"
        >
          <Heart
            className={`w-[18px] h-[18px] transition-colors ${
              saved ? 'fill-primary text-primary' : 'text-foreground/60'
            }`}
          />
        </button>

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

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <a
            href={directionsUrl(activity)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground font-body font-semibold text-sm px-4 py-2 hover:brightness-95 active:scale-[0.98] transition-all"
          >
            <Navigation className="w-4 h-4" />
            Get directions
          </a>
          <button
            onClick={handleShare}
            aria-label={`Share ${activity.name}`}
            className="grid place-items-center w-10 h-10 rounded-full border border-border text-foreground/70 hover:bg-secondary hover:text-foreground active:scale-95 transition-all"
          >
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
