import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Finding {
  id: string;
  species_name: string;
  scientific_name: string;
  kingdom: string;
  confidence: number;
  description: string;
  image_url: string;
  identified_at: string;
}

const KINGDOM_LABELS: Record<string, string> = {
  plant: "Plants",
  mammal: "Mammals",
  insect: "Insects",
  bird: "Birds",
  reptile: "Reptiles",
  fish: "Fish",
  amphibian: "Amphibians",
  other: "Others",
};

const KINGDOM_COLORS: Record<string, string> = {
  plant: "bg-species-plant",
  mammal: "bg-species-mammal",
  insect: "bg-species-insect",
  bird: "bg-species-bird",
  reptile: "bg-species-reptile",
  fish: "bg-species-fish",
  amphibian: "bg-species-amphibian",
  other: "bg-species-other",
};

export const FindingsHistory = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
    
    // Set up realtime subscription
    const channel = supabase
      .channel("species_identifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "species_identifications",
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
    } catch (error) {
      console.error("Error fetching findings:", error);
      toast({
        title: "Error",
        description: "Failed to load your findings",
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
        description: "Finding removed successfully",
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

  const groupedFindings = findings.reduce((acc, finding) => {
    const kingdom = finding.kingdom || "other";
    if (!acc[kingdom]) acc[kingdom] = [];
    acc[kingdom].push(finding);
    return acc;
  }, {} as Record<string, Finding[]>);

  const kingdoms = Object.keys(groupedFindings).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No findings yet. Start identifying species to build your collection!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Findings</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="all">All ({findings.length})</TabsTrigger>
          {kingdoms.map((kingdom) => (
            <TabsTrigger key={kingdom} value={kingdom}>
              {KINGDOM_LABELS[kingdom] || kingdom} ({groupedFindings[kingdom].length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} onDelete={handleDelete} />
          ))}
        </TabsContent>

        {kingdoms.map((kingdom) => (
          <TabsContent key={kingdom} value={kingdom} className="space-y-4 mt-4">
            {groupedFindings[kingdom].map((finding) => (
              <FindingCard key={finding.id} finding={finding} onDelete={handleDelete} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const FindingCard = ({ finding, onDelete }: { finding: Finding; onDelete: (id: string) => void }) => {
  const kingdomColor = KINGDOM_COLORS[finding.kingdom] || KINGDOM_COLORS.other;

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {finding.image_url && (
          <img
            src={finding.image_url}
            alt={finding.species_name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{finding.species_name}</h3>
              <p className="text-sm italic text-muted-foreground">
                {finding.scientific_name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(finding.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Badge className={`${kingdomColor} text-white`}>
              {KINGDOM_LABELS[finding.kingdom] || finding.kingdom}
            </Badge>
            <Badge variant="outline">{finding.confidence}% confident</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">{finding.description}</p>
          
          <p className="text-xs text-muted-foreground">
            {new Date(finding.identified_at).toLocaleDateString()} at{" "}
            {new Date(finding.identified_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Card>
  );
};