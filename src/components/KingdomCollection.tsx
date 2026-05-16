import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Flag, Leaf, Cat, Bug, Bird, Fish, Search, Microscope, ChevronDown, ChevronRight, ChevronLeft, Image as ImageIcon } from "lucide-react";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { IconBadge, getKingdomVariant, IconComponent } from "@/components/IconBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// In-memory cache so revisiting a kingdom page is instant within the session.
const findingsMemoryCache: Record<string, Finding[]> = {};

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

interface GroupedSpecies {
  species_name: string;
  scientific_name: string | null;
  description: string | null;
  findings: Finding[];
  avgConfidence: number;
  latestDate: string;
}

const KINGDOM_LABELS: { [key: string]: string } = {
  plant: "Plants",
  mammal: "Mammals",
  insect: "Insects",
  bird: "Birds",
  reptile: "Reptiles",
  fish: "Fish",
  amphibian: "Amphibians",
  other: "Other Organisms",
};

const KINGDOM_TAXONOMY: { [key: string]: string[] } = {
  plant: ["Eukaryota", "Plantae"],
  mammal: ["Eukaryota", "Animalia", "Chordata", "Mammalia"],
  insect: ["Eukaryota", "Animalia", "Arthropoda", "Insecta"],
  bird: ["Eukaryota", "Animalia", "Chordata", "Aves"],
  reptile: ["Eukaryota", "Animalia", "Chordata", "Reptilia"],
  fish: ["Eukaryota", "Animalia", "Chordata", "Actinopterygii"],
  amphibian: ["Eukaryota", "Animalia", "Chordata", "Amphibia"],
  other: ["Eukaryota"],
};

const KINGDOM_ICONS: { [key: string]: IconComponent } = {
  plant: Leaf,
  mammal: Cat,
  insect: Bug,
  bird: Bird,
  reptile: CrocodileIcon,
  fish: Fish,
  amphibian: FrogIcon,
  other: Microscope,
};

// Slidable sightings carousel component
function SightingsCarousel({ 
  findings, 
  kingdom, 
  KingdomIcon,
  onReport, 
  onDelete 
}: { 
  findings: Finding[]; 
  kingdom: string;
  KingdomIcon: IconComponent;
  onReport: (id: string) => void; 
  onDelete: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : findings.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < findings.length - 1 ? prev + 1 : 0));
  };

  const currentFinding = findings[currentIndex];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {findings.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex-1 relative max-w-[50%]">
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted relative group">
            {currentFinding.image_url ? (
              <img
                src={currentFinding.image_url}
                alt={currentFinding.species_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IconBadge icon={KingdomIcon} size="lg" variant={getKingdomVariant(kingdom)} />
              </div>
            )}
            
            {/* Action overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-white hover:text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onReport(currentFinding.id);
                }}
              >
                <Flag className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(currentFinding.id);
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Sighting info */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {new Date(currentFinding.identified_at).toLocaleDateString()}
            </p>
            {findings.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {currentIndex + 1} / {findings.length}
              </p>
            )}
          </div>
        </div>

        {findings.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dot indicators */}
      {findings.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {findings.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface KingdomCollectionProps {
  kingdom: string;
}

export function KingdomCollection({ kingdom }: KingdomCollectionProps) {
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [expandedSpecies, setExpandedSpecies] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ["kingdom-findings", kingdom] as const;

  const { data: findings = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Finding[]> => {
      const { data, error } = await supabase
        .from("species_identifications")
        .select("*")
        .eq("kingdom", kingdom)
        .order("identified_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Finding[];
      findingsMemoryCache[kingdom] = rows;
      return rows;
    },
    initialData: findingsMemoryCache[kingdom],
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  // Realtime: invalidate the query when rows change.
  useEffect(() => {
    const channel = supabase
      .channel(`${kingdom}_identifications_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'species_identifications' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [kingdom, queryClient]);


  // Group findings by species name
  const groupedSpecies = useMemo(() => {
    const groups: { [key: string]: GroupedSpecies } = {};
    
    findings.forEach((finding) => {
      const key = finding.species_name.toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          species_name: finding.species_name,
          scientific_name: finding.scientific_name,
          description: finding.description,
          findings: [],
          avgConfidence: 0,
          latestDate: finding.identified_at,
        };
      }
      groups[key].findings.push(finding);
      if (new Date(finding.identified_at) > new Date(groups[key].latestDate)) {
        groups[key].latestDate = finding.identified_at;
      }
    });

    // Calculate average confidence for each group
    Object.values(groups).forEach((group) => {
      const sum = group.findings.reduce((acc, f) => acc + (f.confidence || 0), 0);
      group.avgConfidence = Math.round(sum / group.findings.length);
    });

    // Sort by latest finding date
    return Object.values(groups).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [findings]);

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

  const avgConfidence = useMemo(() => {
    if (findings.length === 0) return 0;
    const sum = findings.reduce((acc, f) => acc + (f.confidence || 0), 0);
    return Math.round(sum / findings.length);
  }, [findings]);

  const handleReport = (id: string) => {
    setReportingId(id);
    setShowReport(true);
  };

  const submitReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Report Submitted",
      description: "Thank you for your feedback!",
    });
    setShowReport(false);
    setReportReason("");
    setReportingId(null);
  };

  const toggleExpanded = (speciesName: string) => {
    setExpandedSpecies((prev) => {
      const next = new Set(prev);
      if (next.has(speciesName)) {
        next.delete(speciesName);
      } else {
        next.add(speciesName);
      }
      return next;
    });
  };

  const KingdomIcon = KINGDOM_ICONS[kingdom] || Search;
  const kingdomLabel = KINGDOM_LABELS[kingdom] || kingdom;

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
        <IconBadge icon={KingdomIcon} size="lg" variant={getKingdomVariant(kingdom)} withGlow />
        <h1 className="text-2xl font-bold">{kingdomLabel}</h1>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-2xl font-bold text-primary">{groupedSpecies.length}</div>
          <div className="text-xs text-muted-foreground">Unique Species</div>
        </Card>
        <Card className="p-3 bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="text-2xl font-bold text-foreground">{findings.length}</div>
          <div className="text-xs text-muted-foreground">Total Sightings</div>
        </Card>
        <Card className="p-3 bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="text-2xl font-bold text-foreground">{avgConfidence}%</div>
          <div className="text-xs text-muted-foreground">Avg. Confidence</div>
        </Card>
      </div>

      {groupedSpecies.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-3">
            <IconBadge icon={KingdomIcon} size="xl" variant={getKingdomVariant(kingdom)} withGlow />
          </div>
          <h3 className="text-lg font-semibold mb-1">No {kingdomLabel.toLowerCase()} found</h3>
          <p className="text-sm text-muted-foreground">
            Start identifying with your camera!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedSpecies.map((group) => {
            const isExpanded = expandedSpecies.has(group.species_name);
            const primaryFinding = group.findings[0];
            const hasMultiple = group.findings.length > 1;
            const taxonomy = KINGDOM_TAXONOMY[kingdom] || KINGDOM_TAXONOMY.other;

            return (
              <Card key={group.species_name} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(group.species_name)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted relative">
                        {primaryFinding.image_url ? (
                          <img
                            src={primaryFinding.image_url}
                            alt={group.species_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconBadge icon={KingdomIcon} size="lg" variant={getKingdomVariant(kingdom)} withGlow />
                          </div>
                        )}
                        {hasMultiple && (
                          <div className="absolute bottom-1 right-1 bg-background/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                            <ImageIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">{group.findings.length}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-base truncate">{group.species_name}</h3>
                            {group.scientific_name && (
                              <p className="text-xs italic text-muted-foreground truncate">
                                {group.scientific_name}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isExpanded ? 
                              <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            }
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <IconBadge icon={KingdomIcon} size="xs" variant={getKingdomVariant(kingdom)} withBackground={false} />
                            {kingdomLabel}
                          </Badge>
                          <Badge variant={group.avgConfidence > 80 ? "default" : "outline"} className="text-xs">
                            {group.avgConfidence}%
                          </Badge>
                          {hasMultiple && (
                            <Badge variant="outline" className="text-xs">
                              {group.findings.length} sightings
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(group.latestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 p-3 space-y-4">
                      {/* Description */}
                      {group.description && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">About</p>
                          <p className="text-sm text-foreground leading-relaxed">{group.description}</p>
                        </div>
                      )}

                      {/* Taxonomy Tree - from largest to smallest */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2">Classification</p>
                        <div className="flex items-center gap-1 overflow-x-auto pb-1">
                          {/* Build full taxonomy from Kingdom to Species */}
                          {[...taxonomy, group.scientific_name || group.species_name].map((level, index, arr) => (
                            <div key={level} className="flex items-center gap-1 shrink-0">
                              <Badge 
                                variant={index === arr.length - 1 ? "default" : "outline"} 
                                className={`text-xs ${index === arr.length - 1 ? '' : 'bg-background/50'}`}
                              >
                                {level}
                              </Badge>
                              {index < arr.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Slidable Sightings */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                          Sightings ({group.findings.length})
                        </p>
                        <SightingsCarousel 
                          findings={group.findings} 
                          kingdom={kingdom}
                          KingdomIcon={KingdomIcon}
                          onReport={handleReport}
                          onDelete={handleDelete}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="mx-4 max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Wrong Identification
            </DialogTitle>
            <DialogDescription>
              Help us improve identification accuracy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What should this species be?"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitReport}>
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}