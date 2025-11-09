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

    const { imageData } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            content: `You are an expert biologist and species identification specialist. Analyze images and identify living organisms with extreme precision.

For each identification, provide:
1. Common name (e.g., "Bengal Tiger", "Oak Tree", "Monarch Butterfly")
2. Scientific name (e.g., "Panthera tigris tigris")
3. Category: one of [plant, mammal, insect, bird, reptile, fish, amphibian, other]
4. Confidence percentage (0-100)
5. Brief description (2-3 sentences about the species)

Return ONLY valid JSON in this exact format:
{
  "name": "Common Name",
  "scientificName": "Scientific name",
  "category": "category",
  "confidence": 95,
  "description": "Brief description of the species including habitat and characteristics."
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

    console.log("Species identified:", result.name);

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

    // Save to database
    try {
      const { error: insertError } = await supabase
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
        });

      if (insertError) {
        console.error("Error saving to database:", insertError);
      } else {
        console.log("Identification saved to database");
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
