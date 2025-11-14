import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
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

interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  example_images: string[] | null;
  identified_at: string;
}

export default function NonLivingThings() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("identified_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchItems();
      toast({
        title: "Deleted",
        description: "Item removed from collection",
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4">⚙️ Non-Living Things</h1>
      
      {items.length === 0 ? (
        <Card className="p-12 text-center bg-gray-50 dark:bg-gray-900">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">No items yet</h3>
          <p className="text-muted-foreground">
            Start identifying non-living objects with your camera!
          </p>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl">⚙️</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">{item.name}</h3>
                      {item.category && (
                        <Badge variant="secondary" className="shrink-0 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {(item.image_url || (item.example_images && item.example_images.length > 0)) && (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {item.image_url && (
                          <CarouselItem>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                Your Photo
                              </div>
                            </div>
                          </CarouselItem>
                        )}
                        {item.example_images?.map((imgUrl, idx) => (
                          <CarouselItem key={idx}>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img
                                src={imgUrl}
                                alt={`${item.name} example ${idx + 1}`}
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
                  {item.description && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm text-gray-800 dark:text-gray-200">Description</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Identified on {new Date(item.identified_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="w-full bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
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
