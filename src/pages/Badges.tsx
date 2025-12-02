import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const KINGDOM_LABELS: { [key: string]: string } = {
  plant: "Plants",
  mammal: "Mammals",
  insect: "Insects",
  bird: "Birds",
  reptile: "Reptiles",
  fish: "Fish",
  amphibian: "Amphibians",
  other: "Other",
};

export default function Badges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
    fetchUserBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*");

      if (error) throw error;
      setBadges(data || []);
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
        .select("*, badges(*)")
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setUserBadges(data || []);
    } catch (error) {
      console.error("Error fetching user badges:", error);
    }
  };

  const getBadgeRequirementText = (badge: Badge): string => {
    if (badge.requirement_type === 'total_count') {
      return `Identify ${badge.requirement_value} species`;
    } else if (badge.requirement_type === 'kingdom_count') {
      const req = JSON.parse(badge.requirement_value || '{}');
      const kingdomName = KINGDOM_LABELS[req.kingdom] || req.kingdom;
      return `Find ${req.count} ${kingdomName.toLowerCase()}`;
    } else if (badge.requirement_type === 'single_rare') {
      return 'Find a rare species (single occurrence)';
    }
    return 'Complete special requirement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">🏆 Badges</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Earned ({userBadges.length})</h2>
        {userBadges.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No badges earned yet. Keep exploring!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {userBadges.map((userBadge) => (
              <Card
                key={userBadge.id}
                className="p-3 text-center cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelectedBadge(userBadge.badges)}
              >
                <div className="text-3xl mb-1">{userBadge.badges.icon}</div>
                <h3 className="font-semibold text-xs truncate">{userBadge.badges.name}</h3>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Available</h2>
        <div className="grid grid-cols-3 gap-3">
          {badges
            .filter((badge) => !earnedBadgeIds.has(badge.id))
            .map((badge) => (
              <Card
                key={badge.id}
                className="p-3 text-center cursor-pointer opacity-50 grayscale active:scale-95 transition-transform"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <h3 className="font-semibold text-xs truncate">{badge.name}</h3>
              </Card>
            ))}
        </div>
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{selectedBadge?.icon}</span>
              <span className="text-lg">{selectedBadge?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selectedBadge?.description}</p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-1">Requirement:</p>
              <p className="text-sm text-muted-foreground">
                {selectedBadge && getBadgeRequirementText(selectedBadge)}
              </p>
            </div>
            {selectedBadge && userBadges.some(ub => ub.badge_id === selectedBadge.id) && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <span>✓</span>
                <span>Earned {new Date(userBadges.find(ub => ub.badge_id === selectedBadge.id)?.earned_at || '').toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
