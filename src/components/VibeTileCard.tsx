import { type TileColor } from '@/data/vibes';

interface VibeTileCardProps {
  label: string;
  sublabel?: string;
  icon: string;
  color: TileColor;
  onClick: () => void;
  animDelay?: number;
}

const colorMap: Record<TileColor, string> = {
  amber:    'bg-tile-amber',
  blue:     'bg-tile-blue',
  green:    'bg-tile-green',
  peach:    'bg-tile-peach',
  lavender: 'bg-tile-lavender',
  pink:     'bg-tile-pink',
  yellow:   'bg-tile-yellow',
  sage:     'bg-tile-sage',
};

export default function VibeTileCard({ label, sublabel, icon, color, onClick, animDelay = 0 }: VibeTileCardProps) {
  return (
    <button
      onClick={onClick}
      className="fade-up group relative flex flex-col items-center text-center w-full rounded-tile overflow-hidden shadow-tile hover:shadow-tile-hover transition-all duration-200 hover:-translate-y-1 active:scale-[0.97] cursor-pointer"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Icon area */}
      <div className={`w-full aspect-square ${colorMap[color]} flex items-center justify-center p-6`}>
        <img
          src={icon}
          alt={label}
          className="w-full h-full object-contain"
        />
      </div>
      {/* Label area */}
      <div className="w-full bg-card px-3 py-3 border-t border-border/30">
        <p className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-1 leading-tight line-clamp-1 italic">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}
