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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">🏆 Badges</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Earned Badges ({userBadges.length})</h2>
        {userBadges.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No badges earned yet. Keep exploring to earn your first badge!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {userBadges.map((userBadge) => (
              <Card
                key={userBadge.id}
                className="p-4 text-center cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setSelectedBadge(userBadge.badges)}
              >
                <div className="text-4xl mb-2">{userBadge.badges.icon}</div>
                <h3 className="font-semibold text-sm">{userBadge.badges.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(userBadge.earned_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Available Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {badges
            .filter((badge) => !earnedBadgeIds.has(badge.id))
            .map((badge) => (
              <Card
                key={badge.id}
                className="p-4 text-center cursor-pointer hover:shadow-lg transition-all opacity-50 grayscale hover:opacity-70"
                onClick={() => setSelectedBadge(badge)}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h3 className="font-semibold text-sm">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Not earned</p>
              </Card>
            ))}
        </div>
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{selectedBadge?.icon}</span>
              <span>{selectedBadge?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-base text-muted-foreground">{selectedBadge?.description}</p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-1">Requirement:</p>
              <p className="text-sm text-muted-foreground">
                {selectedBadge && getBadgeRequirementText(selectedBadge)}
              </p>
            </div>
            {selectedBadge && userBadges.some(ub => ub.badge_id === selectedBadge.id) && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <span>✓</span>
                <span>Earned on {new Date(userBadges.find(ub => ub.badge_id === selectedBadge.id)?.earned_at || '').toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
