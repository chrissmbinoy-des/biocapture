import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, Menu, Flag, Leaf, Cat, Bug, Bird, Fish, Microscope } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import CrocodileIcon from "@/components/icons/CrocodileIcon";
import FrogIcon from "@/components/icons/FrogIcon";
import { ActiveBoostsIndicator } from "@/components/ActiveBoostsIndicator";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth listener FIRST, then check session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Only redirect to auth on explicit sign-out, not on token refresh failures
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied or unavailable:", error);
        }
      );
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSelectedImage(imageData);
        identifySpecies(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setSelectedImage(imageData);
    identifySpecies(imageData);
  };

  const identifySpecies = async (imageData: string) => {
    setIsIdentifying(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('identify-species', {
        body: { 
          imageData,
          coordinates 
        },
      });

      // Check for error in response data (edge function returned error JSON)
      if (data?.error) {
        const isNoOrganism = data.error.toLowerCase().includes("no living organism");
        
        if (isNoOrganism) {
          toast({
            title: "No Living Organism Found",
            description: "Try photographing plants, animals, birds, insects, or other living things. Make sure the subject is clearly visible!",
          });
        } else {
          toast({
            title: "Identification Failed",
            description: data.error,
            variant: "destructive",
          });
        }
        setIsIdentifying(false);
        setSelectedImage(null);
        return;
      }

      if (error) {
        const errorMsg = error.message || "";
        const isNoOrganism = errorMsg.toLowerCase().includes("no living organism");
        
        if (isNoOrganism) {
          toast({
            title: "No Living Organism Found",
            description: "Try photographing plants, animals, birds, insects, or other living things. Make sure the subject is clearly visible!",
          });
        } else {
          toast({
            title: "Identification Failed",
            description: errorMsg || "Failed to identify species. Please try again.",
            variant: "destructive",
          });
        }
        setIsIdentifying(false);
        setSelectedImage(null);
        return;
      }

      setResult(data);
      toast({
        title: "Species Identified!",
        description: `Found: ${data.name}`,
      });
    } catch (error: any) {
      console.error("Error identifying species:", error);
      const errorMsg = error?.message || "";
      const isNoOrganism = errorMsg.toLowerCase().includes("no living organism");
      
      if (isNoOrganism) {
        toast({
          title: "No Living Organism Found",
          description: "Try photographing plants, animals, birds, insects, or other living things. Make sure the subject is clearly visible!",
        });
        setSelectedImage(null);
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsIdentifying(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      plant: "bg-species-plant",
      mammal: "bg-species-mammal",
      insect: "bg-species-insect",
      bird: "bg-species-bird",
      reptile: "bg-species-reptile",
      fish: "bg-species-fish",
      amphibian: "bg-species-amphibian",
      other: "bg-species-other"
    };
    return colorMap[category] || colorMap.other;
  };

  const handleReport = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Please provide a reason",
        description: "Tell us why this identification is incorrect",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Report Submitted",
      description: "Thank you for helping improve our identification accuracy!",
    });
    setShowReport(false);
    setReportReason("");
  };

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-accent/20 safe-area-inset">
          {/* Mobile-first header */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
            <div className="flex justify-between items-center">
              <SidebarTrigger>
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-bold">Species Identifier</h1>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>
          </header>

      <div className="px-4 py-4 pb-20 space-y-4">
        {/* Active Boosts Indicator */}
        <ActiveBoostsIndicator userId={session?.user?.id ?? null} />

        {!selectedImage && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-center text-sm text-muted-foreground mb-8">
              Identify any living being with AI
            </p>
            
          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
              <Button
                onClick={() => setShowCamera(true)}
                size="lg"
                className="aspect-square h-auto flex-col gap-3 text-base transition-transform duration-200 active:scale-95 hover:scale-105"
                variant="default"
              >
                <Camera className="h-10 w-10" />
                <span>Take Photo</span>
              </Button>

              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="aspect-square h-full flex flex-col items-center justify-center gap-3 text-base border-2 border-dashed border-border rounded-lg bg-background hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Upload Image</span>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Visual tips info card */}
            <Card className="w-full max-w-sm mt-8 p-4 bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                What can I identify?
              </h3>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-plant/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-species-plant" />
                  </div>
                  <span className="text-xs text-muted-foreground">Plants</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-mammal/20 flex items-center justify-center">
                    <Cat className="w-5 h-5 text-species-mammal" />
                  </div>
                  <span className="text-xs text-muted-foreground">Mammals</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-bird/20 flex items-center justify-center">
                    <Bird className="w-5 h-5 text-species-bird" />
                  </div>
                  <span className="text-xs text-muted-foreground">Birds</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-insect/20 flex items-center justify-center">
                    <Bug className="w-5 h-5 text-species-insect" />
                  </div>
                  <span className="text-xs text-muted-foreground">Insects</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-reptile/20 flex items-center justify-center">
                    <CrocodileIcon className="w-5 h-5 text-species-reptile" />
                  </div>
                  <span className="text-xs text-muted-foreground">Reptiles</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-fish/20 flex items-center justify-center">
                    <Fish className="w-5 h-5 text-species-fish" />
                  </div>
                  <span className="text-xs text-muted-foreground">Fish</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-amphibian/20 flex items-center justify-center">
                    <FrogIcon className="w-5 h-5 text-species-amphibian" />
                  </div>
                  <span className="text-xs text-muted-foreground">Amphibians</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-species-other/20 flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-species-other" />
                  </div>
                  <span className="text-xs text-muted-foreground">Others</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 border-t border-border/50 pt-3">
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Make sure the subject is clearly visible
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Good lighting helps accuracy
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Get close for better details
                </p>
              </div>
            </Card>
          </div>
        )}

        {selectedImage && (
          <Card className="p-4 space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full object-cover max-h-[50vh]"
              />
            </div>

            {isIdentifying && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-base">Identifying...</span>
              </div>
            )}

            {result && !isIdentifying && (
              <div className="space-y-3">
                <div className={`${getCategoryColor(result.category)} p-4 rounded-lg text-white`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold truncate">{result.name}</h3>
                      {result.scientificName && (
                        <p className="text-sm italic opacity-90 truncate">
                          {result.scientificName}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full shrink-0">
                      {result.confidence}%
                    </span>
                  </div>
                  <p className="text-sm opacity-90 capitalize mt-2">
                    {result.category}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">{result.description}</p>

                {/* Report wrong identification */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground transition-transform duration-200 active:scale-95 hover:scale-105"
                  onClick={() => setShowReport(true)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report Wrong Identification
                </Button>
              </div>
            )}

            <Button
              onClick={() => {
                setSelectedImage(null);
                setResult(null);
              }}
              variant="outline"
              className="w-full h-12 transition-transform duration-200 active:scale-95 hover:scale-105"
            >
              Identify Another
            </Button>
          </Card>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
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
              Help us improve by telling us what went wrong
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What should this species be? What details were incorrect?"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 transition-transform duration-200 active:scale-95 hover:scale-105" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button className="flex-1 transition-transform duration-200 active:scale-95 hover:scale-105" onClick={handleReport}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
