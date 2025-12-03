import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Flag, Leaf, Cat, Bug, Bird, Fish, Search, Microscope } from "lucide-react";
import SnakeIcon from "@/components/icons/SnakeIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { IconBadge, getKingdomVariant, IconComponent } from "@/components/IconBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

const ALL_KINGDOMS = ["plant", "mammal", "insect", "bird", "reptile", "fish", "amphibian", "other"];

const KINGDOM_LABELS: { [key: string]: string } = {
  plant: "Plants",
  mammal: "Mammals",
  insect: "Insects",
  bird: "Birds",
  reptile: "Reptiles",
  fish: "Fish",
  amphibian: "Amphibians",
  other: "Other Organisms",
  all: "All"
};

const KINGDOM_ICONS: { [key: string]: IconComponent } = {
  plant: Leaf,
  mammal: Cat,
  insect: Bug,
  bird: Bird,
  reptile: SnakeIcon,
  fish: Fish,
  amphibian: FrogIcon,
  other: Microscope,
};

export default function Species() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState<Stats>({ total: 0, kingdoms: {} });
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingId, setReportingId] = useState<string | null>(null);
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

  const tabs = ["all", ...ALL_KINGDOMS];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Species Collection</h1>
      
      {/* Mobile-friendly stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="p-3 bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="text-2xl font-bold text-foreground">{avgConfidence}%</div>
          <div className="text-xs text-muted-foreground">Avg. Confidence</div>
        </Card>
      </div>

      {/* Horizontal scrolling tabs */}
      <ScrollArea className="w-full mb-4">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="shrink-0 flex items-center gap-1"
            >
              {tab !== "all" && <IconBadge icon={KINGDOM_ICONS[tab] || Search} size="xs" variant={getKingdomVariant(tab)} withBackground={false} />}
              {tab === "all" ? `All (${stats.total})` : `${KINGDOM_LABELS[tab]} (${stats.kingdoms[tab] || 0})`}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {filteredFindings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-3">
            <IconBadge icon={Search} size="xl" withGlow />
          </div>
          <h3 className="text-lg font-semibold mb-1">No species found</h3>
          <p className="text-sm text-muted-foreground">
            Start identifying with your camera!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <Card key={finding.id} className="overflow-hidden">
              <div className="flex gap-3 p-3">
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
                      <IconBadge icon={KINGDOM_ICONS[finding.kingdom] || Search} size="lg" variant={getKingdomVariant(finding.kingdom)} withGlow />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{finding.species_name}</h3>
                      {finding.scientific_name && (
                        <p className="text-xs italic text-muted-foreground truncate">
                          {finding.scientific_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <IconBadge icon={KINGDOM_ICONS[finding.kingdom] || Search} size="xs" variant={getKingdomVariant(finding.kingdom)} withBackground={false} />
                      {KINGDOM_LABELS[finding.kingdom]}
                    </Badge>
                    {finding.confidence && (
                      <Badge variant={finding.confidence > 80 ? "default" : "outline"} className="text-xs">
                        {finding.confidence}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(finding.identified_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                      onClick={() => handleReport(finding.id)}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive"
                      onClick={() => handleDelete(finding.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
