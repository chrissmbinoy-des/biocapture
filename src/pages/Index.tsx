import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, Menu, Flag } from "lucide-react";
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
    // Set up auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

      if (error) {
        toast({
          title: "Identification Failed",
          description: error.message || "Failed to identify species. Please try again.",
          variant: "destructive",
        });
        setIsIdentifying(false);
        return;
      }

      setResult(data);
      toast({
        title: "Species Identified!",
        description: `Found: ${data.name}`,
      });
    } catch (error) {
      console.error("Error identifying species:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 safe-area-inset">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/species")}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Species Identifier</h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="px-4 py-4 pb-20 space-y-4">
        {!selectedImage && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Identify any living being with AI
            </p>
            
            <Button
              onClick={() => setShowCamera(true)}
              size="lg"
              className="w-full h-14 text-base"
              variant="default"
            >
              <Camera className="mr-2 h-6 w-6" />
              Take Photo
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <label htmlFor="file-upload">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-base"
                asChild
              >
                <span>
                  <Upload className="mr-2 h-6 w-6" />
                  Upload Image
                </span>
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
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
                  className="w-full text-muted-foreground"
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
              className="w-full h-12"
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
              <Button variant="outline" className="flex-1" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleReport}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
