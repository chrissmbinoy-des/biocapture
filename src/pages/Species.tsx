import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface Stats {
  total: number;
  kingdoms: { [key: string]: number };
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

export default function Species() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState<Stats>({ total: 0, kingdoms: {} });
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
    
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

      const newStats: Stats = { total: data?.length || 0, kingdoms: {} };
      data?.forEach((finding) => {
        newStats.kingdoms[finding.kingdom] = (newStats.kingdoms[finding.kingdom] || 0) + 1;
      });
      setStats(newStats);
    } catch (error) {
      console.error("Error fetching findings:", error);
      toast({
        title: "Error",
        description: "Failed to load species",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("species_identifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchFindings();
      toast({
        title: "Deleted",
        description: "Species removed from collection",
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete species",
        variant: "destructive",
      });
    }
  };

  const filteredFindings = useMemo(() => {
    if (activeTab === "all") return findings;
    return findings.filter((f) => f.kingdom === activeTab);
  }, [findings, activeTab]);

  const avgConfidence = useMemo(() => {
    if (findings.length === 0) return 0;
    const sum = findings.reduce((acc, f) => acc + (f.confidence || 0), 0);
    return Math.round(sum / findings.length);
  }, [findings]);

  const mostFoundKingdom = useMemo(() => {
    if (Object.keys(stats.kingdoms).length === 0) return "None";
    const maxKingdom = Object.entries(stats.kingdoms).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );
    return KINGDOM_LABELS[maxKingdom[0]] || maxKingdom[0];
  }, [stats.kingdoms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">Species Collection</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4">
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
          {Object.entries(stats.kingdoms).map(([kingdom, count]) => (
            <TabsTrigger key={kingdom} value={kingdom}>
              {KINGDOM_ICONS[kingdom]} {KINGDOM_LABELS[kingdom]} ({count})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredFindings.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No species found</h3>
              <p className="text-muted-foreground">
                Start identifying species with your camera!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFindings.map((finding) => (
                <Card key={finding.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {(finding.image_url || (finding.example_images && finding.example_images.length > 0)) ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {finding.image_url && (
                            <CarouselItem>
                              <div className="relative aspect-square">
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
                          {finding.example_images?.map((imgUrl, idx) => (
                            <CarouselItem key={idx}>
                              <div className="relative aspect-square">
                                <img
                                  src={imgUrl}
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
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                      </Carousel>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
                        {KINGDOM_ICONS[finding.kingdom] || "🔍"}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{finding.species_name}</h3>
                        {finding.scientific_name && (
                          <p className="text-sm italic text-muted-foreground">
                            {finding.scientific_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(finding.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">
                        {KINGDOM_ICONS[finding.kingdom]} {KINGDOM_LABELS[finding.kingdom]}
                      </Badge>
                      {finding.confidence && (
                        <Badge
                          variant={finding.confidence > 80 ? "default" : "outline"}
                        >
                          {finding.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    {finding.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {finding.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(finding.identified_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
