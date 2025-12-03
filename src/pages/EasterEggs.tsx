import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Egg } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IconBadge } from "@/components/IconBadge";

interface EasterEgg {
  id: string;
  species_name: string;
  scientific_name: string | null;
  kingdom: string;
  confidence: number | null;
  description: string | null;
  image_url: string | null;
  identified_at: string;
}

const RARE_KEYWORDS = [
  "endangered", "rare", "critically", "vulnerable", "extinct",
  "threatened", "protected", "unique", "uncommon", "scarce"
];

export default function EasterEggs() {
  const [findings, setFindings] = useState<EasterEgg[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      const { data, error } = await supabase
        .from("species_identifications")
        .select("*")
        .order("identified_at", { ascending: false });

      if (error) throw error;

      // Filter for rare/special findings
      const rareFindings = (data || []).filter((finding) => {
        const desc = finding.description?.toLowerCase() || "";
        const name = finding.species_name?.toLowerCase() || "";
        return RARE_KEYWORDS.some(kw => desc.includes(kw) || name.includes(kw)) ||
               (finding.confidence && finding.confidence < 50);
      });

      setFindings(rareFindings);
    } catch (error) {
      console.error("Error fetching findings:", error);
      toast({
        title: "Error",
        description: "Failed to load easter eggs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <IconBadge icon={Sparkles} size="md" withGlow />
        <h1 className="text-2xl font-bold">Easter Egg Findings</h1>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Rare, endangered, or unusual species you've discovered!
      </p>

      {findings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <IconBadge icon={Egg} size="xl" withGlow />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Easter Eggs Yet</h3>
          <p className="text-sm text-muted-foreground">
            Keep exploring to find rare and endangered species!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {findings.map((finding) => (
            <Card 
              key={finding.id} 
              className="overflow-hidden bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30"
            >
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {finding.image_url ? (
                    <img
                      src={finding.image_url}
                      alt={finding.species_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconBadge icon={Egg} size="lg" withGlow />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconBadge icon={Sparkles} size="xs" withBackground={false} />
                    <h3 className="font-bold text-base truncate">{finding.species_name}</h3>
                  </div>
                  {finding.scientific_name && (
                    <p className="text-xs italic text-muted-foreground truncate">
                      {finding.scientific_name}
                    </p>
                  )}
                  {finding.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {finding.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(finding.identified_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}