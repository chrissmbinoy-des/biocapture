import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, ChevronDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Finding {
  id: string;
  species_name: string;
  scientific_name: string | null;
  kingdom: string;
  confidence: number | null;
  description: string | null;
  image_url: string | null;
  identified_at: string;
}

interface Stats {
  total: number;
  kingdoms: { [key: string]: number };
}

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
  all: "All Species"
};

const KINGDOM_ICONS: { [key: string]: string } = {
  plant: "🌿",
  mammal: "🦁",
  insect: "🦋",
  bird: "🦅",
  reptile: "🦎",
  fish: "🐟",
  amphibian: "🐸",
  other: "🔍",
};

export default function Collection() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState<Stats>({ total: 0, kingdoms: {} });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [singleOccurrences, setSingleOccurrences] = useState<Finding[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
    fetchBadges();
    fetchUserBadges();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('species_identifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'species_identifications'
        },
        () => {
          fetchFindings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFindings = async () => {
    try {
      const { data, error } = await supabase
        .from("species_identifications")
        .select("*")
        .order("identified_at", { ascending: false });

      if (error) throw error;

      setFindings(data || []);
      
      // Calculate stats
      const kingdomCounts: { [key: string]: number } = {};
      const speciesCounts: { [key: string]: number } = {};
      
      data?.forEach((finding) => {
        kingdomCounts[finding.kingdom] = (kingdomCounts[finding.kingdom] || 0) + 1;
        speciesCounts[finding.species_name] = (speciesCounts[finding.species_name] || 0) + 1;
      });
      
      // Find single occurrence species
      const singles = data?.filter(f => speciesCounts[f.species_name] === 1) || [];
      setSingleOccurrences(singles);
      
      const currentStats = {
        total: data?.length || 0,
        kingdoms: kingdomCounts
      };
      setStats(currentStats);

      await checkAndAwardBadges(currentStats, singles);
    } catch (error) {
      console.error("Error fetching findings:", error);
      toast({
        title: "Error",
        description: "Failed to load your collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*");

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
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

  const checkAndAwardBadges = async (currentStats: Stats, currentSingles: Finding[]) => {
    try {
      const { data: currentUserBadges } = await supabase
        .from("user_badges")
        .select("badge_id");

      const earnedBadgeIds = new Set(currentUserBadges?.map(ub => ub.badge_id) || []);

      for (const badge of badges) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let shouldAward = false;

        if (badge.requirement_type === 'total_count') {
          const required = parseInt(badge.requirement_value || '0');
          shouldAward = currentStats.total >= required;
        } else if (badge.requirement_type === 'kingdom_count') {
          const req = JSON.parse(badge.requirement_value || '{}');
          shouldAward = (currentStats.kingdoms[req.kingdom] || 0) >= req.count;
        } else if (badge.requirement_type === 'single_rare') {
          shouldAward = currentSingles.length > 0;
        }

        if (shouldAward) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) continue;
          
          await supabase
            .from("user_badges")
            .insert({ badge_id: badge.id, user_id: user.id });
          
          toast({
            title: "🎉 Badge Earned!",
            description: `${badge.icon} ${badge.name}: ${badge.description}`,
          });
        }
      }

      await fetchUserBadges();
    } catch (error) {
      console.error("Error checking badges:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("species_identifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Finding removed from collection",
      });
    } catch (error) {
      console.error("Error deleting finding:", error);
      toast({
        title: "Error",
        description: "Failed to delete finding",
        variant: "destructive",
      });
    }
  };

  const filteredFindings = activeTab === "all" 
    ? findings 
    : activeTab === "single"
    ? singleOccurrences
    : findings.filter((f) => f.kingdom === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* Badges Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <span>🏅</span> Badges
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {badges.map((badge) => {
              const isEarned = userBadges.some(ub => ub.badge_id === badge.id);
              return (
                <Card
                  key={badge.id}
                  className={`p-3 flex flex-col items-center justify-center text-center transition-all ${
                    isEarned ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'opacity-40 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <div className="text-xs font-semibold line-clamp-1">{badge.name}</div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">My Collection</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Species</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5">
              <div className="text-3xl font-bold text-secondary-foreground">
                {Object.keys(stats.kingdoms).length}
              </div>
              <div className="text-sm text-muted-foreground">Kingdoms</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5">
              <div className="text-3xl font-bold text-foreground">
                {stats.kingdoms[Object.keys(stats.kingdoms).reduce((a, b) => 
                  stats.kingdoms[a] > stats.kingdoms[b] ? a : b, 'plant'
                )] || 0}
              </div>
              <div className="text-sm text-muted-foreground">Most Found</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-muted/30 to-muted/10">
              <div className="text-3xl font-bold text-foreground">
                {findings.length > 0 ? Math.round(
                  findings.reduce((acc, f) => acc + (f.confidence || 0), 0) / findings.length
                ) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg. Confidence</div>
            </Card>
          </div>
        </div>

        {/* Kingdom Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-muted/30 p-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <span>🔍</span>
              <span>All ({stats.total})</span>
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center gap-2">
              <span>✨</span>
              <span>Single Finds ({singleOccurrences.length})</span>
            </TabsTrigger>
            {Object.keys(KINGDOM_LABELS)
              .filter(k => k !== 'all')
              .map((kingdom) => (
                <TabsTrigger key={kingdom} value={kingdom} className="flex items-center gap-2">
                  <span>{KINGDOM_ICONS[kingdom] || "🔍"}</span>
                  <span>{KINGDOM_LABELS[kingdom]} ({stats.kingdoms[kingdom] || 0})</span>
                </TabsTrigger>
              ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredFindings.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">{KINGDOM_ICONS[activeTab] || "🔍"}</div>
                <h3 className="text-xl font-semibold mb-2">No species found yet</h3>
                <p className="text-muted-foreground">
                  Start identifying species to build your collection!
                </p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {filteredFindings.map((finding) => (
                  <AccordionItem
                    key={finding.id}
                    value={finding.id}
                    className="border rounded-lg bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0">
                          {finding.image_url ? (
                            <img
                              src={finding.image_url}
                              alt={finding.species_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">
                              {KINGDOM_ICONS[finding.kingdom] || "🔍"}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base">{finding.species_name}</h3>
                            {finding.confidence && (
                              <Badge variant="secondary" className="shrink-0">
                                {finding.confidence}%
                              </Badge>
                            )}
                          </div>
                          {finding.scientific_name && (
                            <p className="text-sm italic text-muted-foreground">
                              {finding.scientific_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xl">{KINGDOM_ICONS[finding.kingdom] || "🔍"}</span>
                          <span className="text-sm font-medium capitalize">{finding.kingdom}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-2">
                        {finding.image_url && (
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            <img
                              src={finding.image_url}
                              alt={finding.species_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {finding.description && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {finding.description}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Identified on {new Date(finding.identified_at).toLocaleDateString()}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(finding.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Camera Button */}
      <Link to="/">
        <Button
          size="lg"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full h-16 w-16 shadow-lg hover:shadow-xl transition-all z-50"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
