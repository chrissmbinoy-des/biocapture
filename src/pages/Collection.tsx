import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheSpecies, getCachedSpecies, cacheBadges, getCachedBadges, cacheUserBadges, getCachedUserBadges } from "@/lib/offline-db";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Finding {
  id: string;
  species_name: string;
  scientific_name: string | null;
  kingdom: string;
  confidence: number | null;
  description: string | null;
  image_url: string | null;
  example_images: string[] | null;
  identified_at: string;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  coordinates: any;
  image_url: string | null;
  example_images: string[] | null;
  identified_at: string;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  example_images: string[] | null;
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
  const isOnline = useOnlineStatus();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [collectionType, setCollectionType] = useState<"species" | "locations" | "items">("species");
  const [stats, setStats] = useState<Stats>({ total: 0, kingdoms: {} });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [singleOccurrences, setSingleOccurrences] = useState<Finding[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (isOnline) {
        fetchFindings();
        fetchLocations();
        fetchItems();
        fetchBadges();
        fetchUserBadges();
      } else {
        // Load from cache when offline
        try {
          const [cachedSpecies, cachedBadgesData, cachedUserBadgesData] = await Promise.all([
            getCachedSpecies(),
            getCachedBadges(),
            getCachedUserBadges(),
          ]);
          if (cachedSpecies.length > 0) {
            const sorted = cachedSpecies.sort((a: any, b: any) => 
              new Date(b.identified_at).getTime() - new Date(a.identified_at).getTime()
            );
            setFindings(sorted);
            const kingdomCounts: { [key: string]: number } = {};
            const speciesCounts: { [key: string]: number } = {};
            sorted.forEach((f: any) => {
              kingdomCounts[f.kingdom] = (kingdomCounts[f.kingdom] || 0) + 1;
              speciesCounts[f.species_name] = (speciesCounts[f.species_name] || 0) + 1;
            });
            setSingleOccurrences(sorted.filter((f: any) => speciesCounts[f.species_name] === 1));
            setStats({ total: sorted.length, kingdoms: kingdomCounts });
          }
          if (cachedBadgesData.length > 0) setBadges(cachedBadgesData);
          if (cachedUserBadgesData.length > 0) setUserBadges(cachedUserBadgesData);
          setLoading(false);
        } catch {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [isOnline]);

  useEffect(() => {
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
      // Cache for offline use
      if (data) cacheSpecies(data).catch(() => {});
      
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

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("identified_at", { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations",
        variant: "destructive",
      });
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("identified_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from("badges")
        .select("*");

      if (error) throw error;
      setBadges(data || []);
      if (data) cacheBadges(data).catch(() => {});
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
      if (data) cacheUserBadges(data).catch(() => {});
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

  const handleDelete = useCallback(async (id: string, type: "species" | "locations" | "items") => {
    try {
      const table = type === "species" ? "species_identifications" : type;
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (type === "species") {
        fetchFindings();
      } else if (type === "locations") {
        fetchLocations();
      } else {
        fetchItems();
      }

      toast({
        title: "Deleted",
        description: `${type === "species" ? "Species" : type === "locations" ? "Location" : "Item"} removed from collection`,
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getBadgeRequirementText = useCallback((badge: Badge) => {
    if (badge.requirement_type === 'total_count') {
      return `Identify ${badge.requirement_value} species`;
    } else if (badge.requirement_type === 'kingdom_count') {
      const req = JSON.parse(badge.requirement_value || '{}');
      return `Identify ${req.count} ${req.kingdom} species`;
    } else if (badge.requirement_type === 'single_rare') {
      return 'Discover a rare species (found only once in your collection)';
    }
    return 'Complete special requirements';
  }, []);

  const filteredFindings = useMemo(() => {
    if (activeTab === "all") return findings;
    if (activeTab === "single") return singleOccurrences;
    return findings.filter((f) => f.kingdom === activeTab);
  }, [activeTab, findings, singleOccurrences]);

  const avgConfidence = useMemo(() => {
    if (findings.length === 0) return 0;
    return Math.round(
      findings.reduce((acc, f) => acc + (f.confidence || 0), 0) / findings.length
    );
  }, [findings]);

  const mostFoundKingdom = useMemo(() => {
    if (Object.keys(stats.kingdoms).length === 0) return 0;
    const maxKingdom = Object.keys(stats.kingdoms).reduce((a, b) => 
      stats.kingdoms[a] > stats.kingdoms[b] ? a : b, 'plant'
    );
    return stats.kingdoms[maxKingdom] || 0;
  }, [stats.kingdoms]);

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
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:scale-105 ${
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

        {/* Badge Details Dialog */}
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

        {/* Collection Type Selector */}
        <div className="mb-6">
          <Tabs value={collectionType} onValueChange={(v) => setCollectionType(v as "species" | "locations" | "items")} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="species">Species ({stats.total})</TabsTrigger>
              <TabsTrigger value="locations">Locations ({locations.length})</TabsTrigger>
              <TabsTrigger value="items" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                Non-Living Things ({items.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Header - Only show for species */}
        {collectionType === "species" && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">Species Collection</h1>
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
                {mostFoundKingdom}
              </div>
              <div className="text-sm text-muted-foreground">Most Found</div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-muted/30 to-muted/10">
              <div className="text-3xl font-bold text-foreground">
                {avgConfidence}%
              </div>
              <div className="text-sm text-muted-foreground">Avg. Confidence</div>
            </Card>
          </div>
        </div>
        )}

        {/* Locations Section */}
        {collectionType === "locations" && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">📍 Locations</h1>
            {locations.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-xl font-semibold mb-2">No locations yet</h3>
                <p className="text-muted-foreground">
                  Start adding places you've discovered!
                </p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {locations.map((location) => (
                  <AccordionItem
                    key={location.id}
                    value={location.id}
                    className="border rounded-lg bg-card overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                          {location.image_url ? (
                            <img
                              src={location.image_url}
                              alt={location.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-2xl">📍</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-base">{location.name}</h3>
                          {location.coordinates && typeof location.coordinates === 'object' && 'lat' in location.coordinates && (
                            <p className="text-sm text-muted-foreground">
                              {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-2">
                        {(location.image_url || (location.example_images && location.example_images.length > 0)) && (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {location.image_url && (
                                <CarouselItem>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                      src={location.image_url}
                                      alt={location.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Your Photo
                                    </div>
                                  </div>
                                </CarouselItem>
                              )}
                              {location.example_images?.map((imgUrl, idx) => (
                                <CarouselItem key={idx}>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                      src={imgUrl}
                                      alt={`${location.name} example ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Example {idx + 1}
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                        )}
                        {location.description && (
                          <div>
                            <h4 className="font-semibold mb-1 text-sm">Description</h4>
                            <p className="text-sm text-muted-foreground">{location.description}</p>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            Added {new Date(location.identified_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(location.id, "locations")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}

        {/* Items Section */}
        {collectionType === "items" && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-700 dark:text-gray-300">⚙️ Non-Living Things</h1>
            {items.length === 0 ? (
              <Card className="p-12 text-center bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">No items yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start cataloging non-living things you've discovered!
                </p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {items.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-2xl">⚙️</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">{item.name}</h3>
                            {item.category && (
                              <Badge variant="secondary" className="shrink-0 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 pt-2">
                        {(item.image_url || (item.example_images && item.example_images.length > 0)) && (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {item.image_url && (
                                <CarouselItem>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Your Photo
                                    </div>
                                  </div>
                                </CarouselItem>
                              )}
                              {item.example_images?.map((imgUrl, idx) => (
                                <CarouselItem key={idx}>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                                    <img
                                      src={imgUrl}
                                      alt={`${item.name} example ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Example {idx + 1}
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                          </Carousel>
                        )}
                        {item.description && (
                          <div>
                            <h4 className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Added {new Date(item.identified_at).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, "items")}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        )}

        {/* Kingdom Tabs - Only show for species */}
        {collectionType === "species" && (
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
                        <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                          {finding.image_url ? (
                            <img
                              src={finding.image_url}
                              alt={finding.species_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-2xl">
                              {KINGDOM_ICONS[finding.kingdom] || "🔍"}
                            </span>
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
                        {(finding.image_url || (finding.example_images && finding.example_images.length > 0)) && (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {finding.image_url && (
                                <CarouselItem>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                      src={finding.image_url}
                                      alt={finding.species_name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Your Photo
                                    </div>
                                  </div>
                                </CarouselItem>
                              )}
                              {finding.example_images?.map((exampleUrl, idx) => (
                                <CarouselItem key={idx}>
                                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                      src={exampleUrl}
                                      alt={`${finding.species_name} example ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                      Example {idx + 1}
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {((finding.example_images?.length || 0) > 0) && (
                              <>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                              </>
                            )}
                          </Carousel>
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
                            onClick={() => handleDelete(finding.id, "species")}
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
        )}
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
