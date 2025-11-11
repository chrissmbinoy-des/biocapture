import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { decode as base64Decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageData, coordinates } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Coordinates received:", coordinates);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Calling Lovable AI for species identification...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert biologist and species identification specialist. Analyze images and identify both living organisms and non-living things with extreme precision.

IMPORTANT: First determine if the subject is LIVING or NON-LIVING.

For LIVING organisms (animals, plants, fungi, etc.), provide:
1. Common name (e.g., "Bengal Tiger", "Oak Tree", "Monarch Butterfly")
2. Scientific name (e.g., "Panthera tigris tigris")
3. Category: one of [plant, mammal, insect, bird, reptile, fish, amphibian, other]
4. Confidence percentage (0-100)
5. Brief description (2-3 sentences about the species)
6. isLiving: true

For NON-LIVING things (rocks, artifacts, objects, structures, etc.), provide:
1. Name (e.g., "Granite Rock", "Ancient Pottery", "Modern Chair")
2. Category (e.g., "rock", "artifact", "furniture", "structure")
3. Confidence percentage (0-100)
4. Brief description (2-3 sentences about the object)
5. isLiving: false

Return ONLY valid JSON in this exact format:
{
  "name": "Common Name or Object Name",
  "scientificName": "Scientific name (only for living things, null otherwise)",
  "category": "category",
  "confidence": 95,
  "description": "Brief description of the species or object.",
  "isLiving": true/false
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this living organism with maximum accuracy. Provide detailed species information."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to identify species" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Lovable AI response received");
    
    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse identification result" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Identified:", result.name, "Living:", result.isLiving);

    // Get place name from coordinates using reverse geocoding
    let placeName = null;
    if (coordinates) {
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}`,
          {
            headers: {
              'User-Agent': 'SpeciesIdentificationApp/1.0'
            }
          }
        );
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          const address = geocodeData.address;
          placeName = address.city || address.town || address.village || address.county || address.state || geocodeData.display_name;
          console.log("Place name:", placeName);
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
      }
    }

    // Map category to kingdom
    const kingdomMap: Record<string, string> = {
      plant: "plant",
      mammal: "mammal",
      insect: "insect",
      bird: "bird",
      reptile: "reptile",
      fish: "fish",
      amphibian: "amphibian",
    };
    const kingdom = kingdomMap[result.category.toLowerCase()] || "other";

    // Upload user's image to storage
    let imageUrl = imageData;
    try {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = base64Decode(base64Data);
      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      const serviceSupabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const { error: uploadError } = await serviceSupabase.storage
        .from('species-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });
      
      if (!uploadError) {
        const { data: { publicUrl } } = serviceSupabase.storage
          .from('species-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
        console.log("Image uploaded to storage");
      }
    } catch (uploadErr) {
      console.error("Failed to upload image:", uploadErr);
      // Continue with base64 if upload fails
    }

    // Generate example images
    const exampleImages: string[] = [];
    console.log("Generating example images...");
    
    try {
      for (let i = 0; i < 2; i++) {
        const examplePrompt = `Generate a high-quality, realistic photograph of ${result.name}${result.scientificName ? ` (${result.scientificName})` : ''} in its natural habitat. Show the ${kingdom} clearly with natural lighting and professional wildlife photography style.`;
        
        const exampleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: examplePrompt
              }
            ],
            modalities: ['image', 'text']
          })
        });
        
        if (exampleResponse.ok) {
          const exampleData = await exampleResponse.json();
          const generatedImageUrl = exampleData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (generatedImageUrl) {
            // Upload generated example to storage
            try {
              const exampleBase64 = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
              const exampleBuffer = base64Decode(exampleBase64);
              const exampleFileName = `examples/${result.name.replace(/\s+/g, '_')}_${Date.now()}_${i}.jpg`;
              
              const serviceSupabase = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
              );
              
              const { error: exampleUploadError } = await serviceSupabase.storage
                .from('species-images')
                .upload(exampleFileName, exampleBuffer, {
                  contentType: 'image/jpeg',
                  upsert: false
                });
              
              if (!exampleUploadError) {
                const { data: { publicUrl: examplePublicUrl } } = serviceSupabase.storage
                  .from('species-images')
                  .getPublicUrl(exampleFileName);
                
                exampleImages.push(examplePublicUrl);
              }
            } catch (exUploadErr) {
              console.error("Failed to upload example image:", exUploadErr);
            }
          }
        }
      }
      console.log("Generated example images:", exampleImages.length);
    } catch (exampleErr) {
      console.error("Error generating example images:", exampleErr);
      // Continue without examples if generation fails
    }

    // Save to appropriate database table based on living/non-living
    try {
      if (result.isLiving) {
        // Save living organisms to species_identifications
        const { data: identificationData, error: insertError } = await supabase
          .from('species_identifications')
          .insert({
            user_id: user.id,
            species_name: result.name,
            scientific_name: result.scientificName,
            kingdom: kingdom,
            confidence: result.confidence,
            description: result.description,
            image_url: imageUrl,
            example_images: exampleImages,
            coordinates: coordinates,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error saving species to database:", insertError);
        } else {
          console.log("Species identification saved to database");
        }
      } else {
        // Save non-living things to items table
        const { error: itemError } = await supabase
          .from('items')
          .insert({
            user_id: user.id,
            name: result.name,
            category: result.category,
            description: result.description,
            image_url: imageUrl,
            example_images: exampleImages,
          });

        if (itemError) {
          console.error("Error saving item to database:", itemError);
        } else {
          console.log("Non-living item saved to database");
        }
      }

      // Save to locations table if coordinates are available
      if (coordinates && placeName) {
        try {
          const { error: locationError } = await supabase
            .from('locations')
            .insert({
              user_id: user.id,
              name: placeName,
              description: result.isLiving 
                ? `Location where ${result.name} was found`
                : `Location of ${result.name}`,
              coordinates: coordinates,
              image_url: imageUrl,
              example_images: exampleImages,
            });

          if (locationError) {
            console.error("Error saving location:", locationError);
          } else {
            console.log("Location saved to database");
          }
        } catch (locationErr) {
          console.error("Location save error:", locationErr);
        }
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in identify-species function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
