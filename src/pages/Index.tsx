import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, LogOut, Archive } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<any>(null);
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

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
        body: { imageData },
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

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1 space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Species Identifier</h1>
              <p className="text-muted-foreground">
                Identify any living being with AI-powered precision
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/collection")}>
                <Archive className="mr-2 h-4 w-4" />
                Collection
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {!selectedImage && (
            <Card className="p-8">
              <div className="space-y-4">
                <Button
                  onClick={() => setShowCamera(true)}
                  size="lg"
                  className="w-full"
                  variant="default"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Take Photo
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <label htmlFor="file-upload">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-5 w-5" />
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
            </Card>
          )}

          {selectedImage && (
            <Card className="p-6 space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full rounded-lg object-cover max-h-96"
                />
              </div>

              {isIdentifying && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-lg">Identifying species...</span>
                </div>
              )}

              {result && !isIdentifying && (
                <div className="space-y-4">
                  <div
                    className={`${getCategoryColor(result.category)} p-4 rounded-lg text-white`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold">{result.name}</h3>
                          <p className="text-sm italic opacity-90">
                            {result.scientificName}
                          </p>
                        </div>
                        <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                          {result.confidence}% match
                        </span>
                      </div>
                      <p className="text-sm opacity-90 capitalize">
                        Category: {result.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground">{result.description}</p>
                </div>
              )}

              <Button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
                variant="outline"
                className="w-full"
              >
                Identify Another
              </Button>
            </Card>
          )}
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Index;
