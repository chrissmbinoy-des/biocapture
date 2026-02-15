import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useActiveBoosts } from "@/hooks/useActiveBoosts";
import { Coins, Shield, PlusCircle, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveBoostsIndicatorProps {
  userId: string | null;
}

interface BoostConfig {
  icon: React.ElementType;
  label: string;
  isRare?: boolean;
}

const boostConfig: Record<string, BoostConfig> = {
  double_coins: { icon: Coins, label: "2x Coins", isRare: true },
  streak_shield: { icon: Shield, label: "Shield", isRare: false },
  extra_challenge: { icon: PlusCircle, label: "+Challenge", isRare: false },
};

const defaultConfig: BoostConfig = { icon: Sparkles, label: "Boost", isRare: false };

const formatTimeLeft = (expiresAt: string | null): string | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export const ActiveBoostsIndicator = ({ userId }: ActiveBoostsIndicatorProps) => {
  const { data: boosts = [], isLoading } = useActiveBoosts(userId);
  const [, setTick] = useState(0);

  // Re-render every minute to update countdown
  useEffect(() => {
    if (boosts.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [boosts.length]);

  if (isLoading || boosts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Sparkles className="h-4 w-4 text-muted-foreground" />
      {boosts.map((boost, index) => {
        const config = boostConfig[boost.type] || defaultConfig;
        const Icon = config.icon;
        const isRare = config.isRare;
        const timeLeft = formatTimeLeft(boost.expiresAt);

        return (
          <Badge
            key={`${boost.type}-${index}`}
            variant="secondary"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all",
              isRare && "bg-[hsl(var(--rarity-rare)/0.2)] text-[hsl(var(--rarity-rare))] border-[hsl(var(--rarity-rare)/0.3)]"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isRare && "text-[hsl(var(--rarity-rare))]")} />
            <span>{config.label}</span>
            {timeLeft && (
              <>
                <Clock className="h-3 w-3 ml-1 opacity-70" />
                <span className="text-[10px] opacity-80">{timeLeft}</span>
              </>
            )}
          </Badge>
        );
      })}
    </div>
  );
};
