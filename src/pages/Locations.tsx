import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Location {
  id: string;
  name: string;
  description: string | null;
  coordinates: any;
  image_url: string | null;
  example_images: string[] | null;
  identified_at: string;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchLocations();
      toast({
        title: "Deleted",
        description: "Location removed from collection",
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
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
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-bold">Locations</h1>
      </div>
      
      {locations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-3">
            <MapPin className="h-12 w-12 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No locations yet</h3>
          <p className="text-sm text-muted-foreground">
            Enable location access to track where you find species
          </p>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {locations.map((location) => (
            <AccordionItem
              key={location.id}
              value={location.id}
              className="border rounded-lg overflow-hidden"
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
                      <MapPin className="h-8 w-8 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-base">{location.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(location.identified_at).toLocaleDateString()}
                    </p>
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
                  {location.coordinates && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Coordinates</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {location.coordinates.latitude?.toFixed(6)}, {location.coordinates.longitude?.toFixed(6)}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Location
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
