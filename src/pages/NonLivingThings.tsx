import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Box } from "lucide-react";
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
import { IconBadge } from "@/components/IconBadge";

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <IconBadge icon={Box} size="md" variant="nonliving" withGlow />
        <h1 className="text-2xl font-bold">Non-Living Things</h1>
      </div>
      
      {items.length === 0 ? (
        <Card className="p-8 text-center bg-muted/30">
          <div className="flex justify-center mb-3">
            <IconBadge icon={Box} size="xl" variant="nonliving" withGlow />
          </div>
          <h3 className="text-lg font-semibold mb-1">No items yet</h3>
          <p className="text-sm text-muted-foreground">
            Identify non-living objects with your camera!
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
                  <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <IconBadge icon={Box} size="lg" variant="nonliving" />
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
