import { useEffect, useState } from "react";
import { useActiveBoosts } from "@/hooks/useActiveBoosts";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Shield, PlusCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import CoinIcon from "@/components/icons/CoinIcon";

const boostIcons: Record<string, React.ReactNode> = {
  double_coins: <CoinIcon className="h-3 w-3" />,
  streak_shield: <Shield className="h-3 w-3" />,
  extra_challenges: <PlusCircle className="h-3 w-3" />,
};

const boostLabels: Record<string, string> = {
  double_coins: "2x",
  streak_shield: "🛡",
  extra_challenges: "+",
};

interface BoostItemProps {
  type: string;
  expiresAt: string | null;
}

const BoostItem = ({ type, expiresAt }: BoostItemProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft("∞");
      setProgress(100);
      return;
    }

    const updateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("0m");
        setProgress(0);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h`);
      } else {
        setTimeLeft(`${minutes}m`);
      }

      // Assume 24h max duration for progress calculation
      const maxDuration = 24 * 60 * 60 * 1000;
      const elapsed = maxDuration - diff;
      setProgress(Math.max(0, Math.min(100, (diff / maxDuration) * 100)));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-1 bg-[hsl(var(--species-plant))]/15 border border-[hsl(var(--species-plant))]/30 rounded px-1.5 py-0.5">
      <div className="text-[hsl(var(--species-plant))]">
        {boostIcons[type] || <Zap className="h-3 w-3" />}
      </div>
      <div className="flex items-center gap-0.5">
        <div 
          className="h-1 w-6 bg-muted rounded-full overflow-hidden"
          title={`${Math.round(progress)}% remaining`}
        >
          <div 
            className="h-full bg-[hsl(var(--species-plant))] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[9px] font-medium text-[hsl(var(--species-plant))]">
          {timeLeft}
        </span>
      </div>
    </div>
  );
};

export const SidebarBoostIndicator = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: activeBoosts = [] } = useActiveBoosts(userId);

  if (activeBoosts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 ml-2">
      {activeBoosts.slice(0, 2).map((boost, index) => (
        <BoostItem 
          key={`${boost.type}-${index}`} 
          type={boost.type} 
          expiresAt={boost.expiresAt} 
        />
      ))}
      {activeBoosts.length > 2 && (
        <span className="text-[9px] text-muted-foreground">+{activeBoosts.length - 2}</span>
      )}
    </div>
  );
};
