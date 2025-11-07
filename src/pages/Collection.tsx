import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
    
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
      data?.forEach((finding) => {
        kingdomCounts[finding.kingdom] = (kingdomCounts[finding.kingdom] || 0) + 1;
      });
      
      setStats({
        total: data?.length || 0,
        kingdoms: kingdomCounts
      });
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
    : findings.filter((f) => f.kingdom === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
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
            {Object.keys(stats.kingdoms).map((kingdom) => (
              <TabsTrigger key={kingdom} value={kingdom} className="flex items-center gap-2">
                <span>{KINGDOM_ICONS[kingdom] || "🔍"}</span>
                <span>{KINGDOM_LABELS[kingdom]} ({stats.kingdoms[kingdom]})</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFindings.map((finding) => (
                  <Card key={finding.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      {finding.image_url ? (
                        <img
                          src={finding.image_url}
                          alt={finding.species_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
                          {KINGDOM_ICONS[finding.kingdom] || "🔍"}
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(finding.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg line-clamp-1">{finding.species_name}</h3>
                        {finding.confidence && (
                          <Badge variant="secondary" className="shrink-0">
                            {finding.confidence}%
                          </Badge>
                        )}
                      </div>
                      {finding.scientific_name && (
                        <p className="text-sm italic text-muted-foreground mb-2 line-clamp-1">
                          {finding.scientific_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{KINGDOM_ICONS[finding.kingdom] || "🔍"}</span>
                        <span className="text-sm font-medium capitalize">{finding.kingdom}</span>
                      </div>
                      {finding.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
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
    </div>
  );
}
