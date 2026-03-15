import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheBadges, getCachedBadges, cacheUserBadges, getCachedUserBadges, getCachedSpecies } from "@/lib/offline-db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BadgeProgressCircle } from "@/components/BadgeProgressCircle";
import { getBadgeIcon, getBadgeColor, getDifficultyLabel, BADGE_COLOR_HSL, RARITY_ORDER, KINGDOM_LABELS } from "@/lib/badge-utils";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: string | null;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

interface ProgressData {
  totalCount: number;
  kingdomCounts: { [key: string]: number };
  locationCount: number;
  challengeCount: number;
  kingdomDiversity: number;
}


export default function Badges() {
  const isOnline = useOnlineStatus();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [progress, setProgress] = useState<ProgressData>({
    totalCount: 0, kingdomCounts: {}, locationCount: 0,
    challengeCount: 0, kingdomDiversity: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (isOnline) {
        fetchBadges();
        fetchUserBadges();
        fetchProgress();
      } else {
        try {
          const [cachedB, cachedUB, cachedSpecies] = await Promise.all([
            getCachedBadges(),
            getCachedUserBadges(),
            getCachedSpecies(),
          ]);
          if (cachedB.length > 0) setBadges(cachedB);
          if (cachedUB.length > 0) setUserBadges(cachedUB);
          // Compute progress from cached species
          const kingdomCounts: { [key: string]: number } = {};
          cachedSpecies.forEach((s: any) => {
            kingdomCounts[s.kingdom] = (kingdomCounts[s.kingdom] || 0) + 1;
          });
          setProgress({
            totalCount: cachedSpecies.length,
            kingdomCounts,
            locationCount: 0,
            challengeCount: 0,
            kingdomDiversity: Object.keys(kingdomCounts).length,
          });
          setLoading(false);
        } catch {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [isOnline]);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase.from("badges").select("*");
      if (error) throw error;
      setBadges(data || []);
      if (data) cacheBadges(data).catch(() => {});
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id,badge_id,earned_at,badges(id,name,description,icon,requirement_type,requirement_value)")
        .order("earned_at", { ascending: false });
      if (error) throw error;
      setUserBadges(data || []);
      if (data) cacheUserBadges(data).catch(() => {});
    } catch (error) {
      console.error("Error fetching user badges:", error);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data: species } = await supabase.from("species_identifications").select("kingdom");
      const kingdomCounts: { [key: string]: number } = {};
      (species || []).forEach((s) => {
        kingdomCounts[s.kingdom] = (kingdomCounts[s.kingdom] || 0) + 1;
      });
      const { count: locationCount } = await supabase
        .from("locations").select("*", { count: "exact", head: true });
      const { count: challengeCount } = await supabase
        .from("user_daily_challenges").select("*", { count: "exact", head: true })
        .eq("is_completed", true);
      setProgress({
        totalCount: species?.length || 0, kingdomCounts,
        locationCount: locationCount || 0, challengeCount: challengeCount || 0,
        kingdomDiversity: Object.keys(kingdomCounts).length,
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const getBadgeProgress = (badge: Badge): number => {
    if (badge.requirement_type === "total_count") {
      const target = parseInt(badge.requirement_value || "1");
      return Math.min(progress.totalCount / target, 1);
    } else if (badge.requirement_type === "kingdom_count") {
      const req = JSON.parse(badge.requirement_value || "{}");
      const current = progress.kingdomCounts[req.kingdom] || 0;
      return Math.min(current / req.count, 1);
    } else if (badge.requirement_type === "kingdom_diversity") {
      const target = parseInt(badge.requirement_value || "1");
      return Math.min(progress.kingdomDiversity / target, 1);
    } else if (badge.requirement_type === "location_count") {
      const target = parseInt(badge.requirement_value || "1");
      return Math.min(progress.locationCount / target, 1);
    } else if (badge.requirement_type === "challenge_count") {
      const target = parseInt(badge.requirement_value || "1");
      return Math.min(progress.challengeCount / target, 1);
    } else if (badge.requirement_type === "single_rare") {
      return 0;
    }
    return 0;
  };

  const getBadgeRequirementText = (badge: Badge): string => {
    if (badge.requirement_type === "total_count") return `Identify ${badge.requirement_value} species`;
    if (badge.requirement_type === "kingdom_count") {
      const req = JSON.parse(badge.requirement_value || "{}");
      return `Find ${req.count} ${(KINGDOM_LABELS[req.kingdom] || req.kingdom).toLowerCase()}`;
    }
    if (badge.requirement_type === "kingdom_diversity") return `Find species in ${badge.requirement_value} different kingdoms`;
    if (badge.requirement_type === "location_count") return `Discover species in ${badge.requirement_value} locations`;
    if (badge.requirement_type === "challenge_count") return `Complete ${badge.requirement_value} daily challenges`;
    if (badge.requirement_type === "streak") return `Identify species ${badge.requirement_value} days in a row`;
    if (badge.requirement_type === "single_rare") return "Find a rare species (single occurrence)";
    return "Complete special requirement";
  };

  const getProgressText = (badge: Badge): string => {
    const isEarned = userBadges.some((ub) => ub.badge_id === badge.id);
    if (isEarned) return "Completed!";
    if (badge.requirement_type === "total_count") {
      const target = parseInt(badge.requirement_value || "1");
      return `${progress.totalCount}/${target}`;
    } else if (badge.requirement_type === "kingdom_count") {
      const req = JSON.parse(badge.requirement_value || "{}");
      return `${progress.kingdomCounts[req.kingdom] || 0}/${req.count}`;
    } else if (badge.requirement_type === "kingdom_diversity") {
      return `${progress.kingdomDiversity}/${badge.requirement_value}`;
    } else if (badge.requirement_type === "location_count") {
      return `${progress.locationCount}/${badge.requirement_value}`;
    } else if (badge.requirement_type === "challenge_count") {
      return `${progress.challengeCount}/${badge.requirement_value}`;
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortByRarity = (a: Badge, b: Badge) => RARITY_ORDER[getBadgeColor(a)] - RARITY_ORDER[getBadgeColor(b)];

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
  const sortedEarnedBadges = [...userBadges].sort((a, b) => sortByRarity(a.badges as unknown as Badge, b.badges as unknown as Badge));
  const availableBadges = badges.filter((badge) => !earnedBadgeIds.has(badge.id)).sort(sortByRarity);

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Badges</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Earned ({sortedEarnedBadges.length})</h2>
        {sortedEarnedBadges.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No badges earned yet. Keep exploring!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {sortedEarnedBadges.map((userBadge) => (
              <Card
                key={userBadge.id}
                className="p-3 text-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelectedBadge(userBadge.badges)}
              >
                <div className="flex justify-center mb-2">
                  <BadgeProgressCircle
                    icon={getBadgeIcon(userBadge.badges.icon)}
                    progress={1}
                    isEarned={true}
                    size="lg"
                    color={getBadgeColor(userBadge.badges)}
                  />
                </div>
                <h3 className="font-semibold text-xs truncate">{userBadge.badges.name}</h3>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Available ({availableBadges.length})</h2>
        <div className="grid grid-cols-3 gap-3">
          {availableBadges.map((badge) => {
            const badgeProgress = getBadgeProgress(badge);
            const diffColor = getBadgeColor(badge);
            return (
              <Card
                key={badge.id}
                className="p-3 text-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="flex justify-center mb-2">
                  <BadgeProgressCircle
                    icon={getBadgeIcon(badge.icon)}
                    progress={badgeProgress}
                    isEarned={false}
                    size="lg"
                    color={diffColor}
                  />
                </div>
                <h3 className="font-semibold text-xs truncate">{badge.name}</h3>
                <p className="text-[10px] text-muted-foreground">{getProgressText(badge)}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <BadgeProgressCircle
                icon={getBadgeIcon(selectedBadge?.icon || "")}
                progress={selectedBadge ? (earnedBadgeIds.has(selectedBadge.id) ? 1 : getBadgeProgress(selectedBadge)) : 0}
                isEarned={selectedBadge ? earnedBadgeIds.has(selectedBadge.id) : false}
                size="lg"
                color={selectedBadge ? getBadgeColor(selectedBadge) : "green"}
              />
              <div>
                <span className="text-lg">{selectedBadge?.name}</span>
                {selectedBadge && (
                  <p className="text-xs font-medium" style={{ color: BADGE_COLOR_HSL[getBadgeColor(selectedBadge)] }}>
                    {getDifficultyLabel(getBadgeColor(selectedBadge))}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Requirement:</p>
              <p className="text-sm text-muted-foreground">
                {selectedBadge && getBadgeRequirementText(selectedBadge)}
              </p>
              {selectedBadge && !earnedBadgeIds.has(selectedBadge.id) && (
                <p className="text-xs text-primary mt-2 font-medium">
                  Progress: {getProgressText(selectedBadge)}
                </p>
              )}
            </div>
            {selectedBadge && userBadges.some((ub) => ub.badge_id === selectedBadge.id) && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Check className="h-4 w-4" />
                <span>
                  Earned{" "}
                  {new Date(
                    userBadges.find((ub) => ub.badge_id === selectedBadge.id)?.earned_at || ""
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
