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
      console.error("Auth error:", userError);
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

    console.log("User ID:", user.id);
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
            content: `You are an expert biologist and species identification specialist. Analyze images and identify living organisms with precision.

You can identify living organisms: animals, plants, fungi, bacteria, protists, algae, lichens, and other life forms.

If the image clearly does NOT contain any living organism (e.g., empty background, just rocks, man-made objects only, fossils without life), respond with:
{"error": "NO_LIVING_ORGANISM", "message": "No living organism detected in this image."}

However, if you can see ANY living thing, even partially or with low confidence, try to identify it. Be generous in detection - if there's a plant, animal, insect, or any organism visible, identify it.

For living organisms, provide:
1. Common name (e.g., "Bengal Tiger", "Oak Tree", "Monarch Butterfly")
2. Scientific name (e.g., "Panthera tigris tigris")
3. Category: one of [plant, mammal, insect, bird, reptile, fish, amphibian, other]
   - Use "other" for: fungi, bacteria, protists, microscopic organisms, slime molds, lichens, algae, and any other living organisms that don't fit the main categories
4. Confidence percentage (0-100) - be realistic but not overly conservative
5. Brief description (2-3 sentences about the species)

Return ONLY valid JSON in this exact format:
{
  "name": "Common Name",
  "scientificName": "Scientific name",
  "category": "category",
  "confidence": 85,
  "description": "Brief description of the species."
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify the living organism in this image. If you can see any plant, animal, fungus, or other living thing, identify it. Only return the NO_LIVING_ORGANISM error if the image truly contains no life forms at all."
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
        JSON.stringify({ error: "Failed to identify species. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Lovable AI response received");
    
    const aiResponse = data.choices?.[0]?.message?.content;
    console.log("AI raw response:", aiResponse);
    
    if (!aiResponse) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Invalid AI response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from AI
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse.trim();
      result = JSON.parse(jsonStr);
      console.log("Parsed result:", result);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response was:", aiResponse);
      return new Response(
        JSON.stringify({ error: "Failed to parse identification result. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if AI returned an error (no living organism)
    if (result.error === "NO_LIVING_ORGANISM") {
      console.log("No living organism detected");
      return new Response(
        JSON.stringify({ error: "No living organism detected. Please take a photo of a plant, animal, or other living thing." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!result.name || !result.category) {
      console.error("Missing required fields in result:", result);
      return new Response(
        JSON.stringify({ error: "Incomplete identification result. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Identified:", result.name, "Category:", result.category);

    // Get place name and country from coordinates using reverse geocoding
    let placeName = null;
    let country = null;
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
          country = address.country || null;
          console.log("Place name:", placeName, "Country:", country);
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

    // Create service client for operations that need elevated privileges
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if this species has already been identified by this user
    const speciesNameLower = result.name.toLowerCase().trim();
    const { data: existingSpecies, error: existingError } = await serviceSupabase
      .from('species_identifications')
      .select('id, species_name')
      .eq('user_id', user.id);
    
    if (existingError) {
      console.error("Error checking existing species:", existingError);
    }

    const isNewSpecies = !existingSpecies?.some(
      (s) => s.species_name.toLowerCase().trim() === speciesNameLower
    );
    
    console.log("Is new species:", isNewSpecies, "Existing count:", existingSpecies?.length || 0);

    // Upload user's image to storage
    let imageUrl = imageData;
    try {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = base64Decode(base64Data);
      const fileName = `${user.id}/${Date.now()}.jpg`;
      
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
            model: 'google/gemini-3-pro-image-preview',
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

    // Save to species_identifications table
    try {
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
          country: country,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error saving species to database:", insertError);
      } else {
        console.log("Species identification saved to database");

        // Update login streak (sighting triggers streak)
        try {
          const today = new Date().toISOString().split("T")[0];
          const { data: streakData } = await serviceSupabase
            .from("login_streaks")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!streakData) {
            // Create new streak record
            await serviceSupabase
              .from("login_streaks")
              .insert({
                user_id: user.id,
                current_streak: 1,
                longest_streak: 1,
                last_login_date: today,
              });
            console.log("New login streak started");
          } else {
            const lastLogin = streakData.last_login_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            if (lastLogin !== today) {
              if (lastLogin === yesterdayStr) {
                // Consecutive day - increment streak
                const newStreak = streakData.current_streak + 1;
                const newLongest = Math.max(newStreak, streakData.longest_streak);
                await serviceSupabase
                  .from("login_streaks")
                  .update({
                    current_streak: newStreak,
                    longest_streak: newLongest,
                    last_login_date: today,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", user.id);
                console.log("Streak incremented to:", newStreak);
              } else if (!lastLogin || streakData.current_streak === 0) {
                // First login after reset or never logged in
                await serviceSupabase
                  .from("login_streaks")
                  .update({
                    current_streak: 1,
                    last_login_date: today,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", user.id);
                console.log("Streak started at 1");
              }
              // If lastLogin is more than a day ago and current_streak > 0, 
              // the streak page will handle the reset on visit
            }
          }
        } catch (streakErr) {
          console.error("Error updating login streak:", streakErr);
        }
        
        // Only award coins if this is a NEW species for this user
        if (isNewSpecies) {
          // Award coins based on kingdom
          const coinRewards: Record<string, number> = {
            plant: 5,
            mammal: 10,
            insect: 5,
            bird: 50,
            reptile: 20,
            fish: 30,
            amphibian: 20,
            other: 15,
          };
          
          let coinReward = coinRewards[kingdom] || 15;
          
          // Check for active double coins boost
          try {
            const now = new Date().toISOString();
            const { data: activePurchases } = await serviceSupabase
              .from('user_purchases')
              .select('*, shop_items(*)')
              .eq('user_id', user.id)
              .eq('is_active', true);
            
            if (activePurchases) {
              for (const purchase of activePurchases) {
                if (purchase.shop_items?.category === 'boost') {
                  const metadata = purchase.shop_items.metadata as Record<string, unknown>;
                  if (metadata?.boost_type === 'double_coins') {
                    // Check if not expired
                    if (!purchase.expires_at || new Date(purchase.expires_at) > new Date(now)) {
                      coinReward *= 2;
                      console.log("Double coins boost applied! Reward:", coinReward);
                      break;
                    }
                  }
                }
              }
            }
          } catch (boostErr) {
            console.error("Error checking boosts:", boostErr);
          }
          
          // Award coins for discovery
          try {
            const { data: coinData } = await serviceSupabase
              .from('user_coins')
              .select('balance')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (coinData) {
              await serviceSupabase
                .from('user_coins')
                .update({ 
                  balance: coinData.balance + coinReward,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
            } else {
              await serviceSupabase
                .from('user_coins')
                .insert({ 
                  user_id: user.id, 
                  balance: coinReward 
                });
            }
            console.log(`Awarded ${coinReward} coins for discovering NEW species ${result.name} (${kingdom})`);
          } catch (coinErr) {
            console.error("Error awarding coins:", coinErr);
          }
        } else {
          console.log(`No coins awarded - ${result.name} was already identified by this user`);
        }
        
        // Check and complete daily challenges
        try {
          const today = new Date().toISOString().split("T")[0];
          
          // Fetch user's incomplete challenges for today
          const { data: userChallenges } = await supabase
            .from('user_daily_challenges')
            .select('*, daily_challenge_templates(*)')
            .eq('user_id', user.id)
            .eq('challenge_date', today)
            .eq('is_completed', false);
          
          if (userChallenges && userChallenges.length > 0) {
            // Get today's species count for this user
            const todayStart = new Date(today);
            const { data: todaySpecies } = await supabase
              .from('species_identifications')
              .select('kingdom')
              .eq('user_id', user.id)
              .gte('identified_at', todayStart.toISOString());
            
            const todayCount = todaySpecies?.length || 0;
            const todayKingdoms = new Set(todaySpecies?.map(s => s.kingdom) || []);
            
            for (const challenge of userChallenges) {
              const template = challenge.daily_challenge_templates;
              let shouldComplete = false;
              let currentProgress = 0;
              const targetValue = parseInt(template.target_value || '1');
              
              if (template.challenge_type === 'identify_kingdom') {
                // Check if identified a species of the required kingdom
                const kingdomCount = todaySpecies?.filter(s => s.kingdom === template.target_value).length || 0;
                currentProgress = kingdomCount;
                shouldComplete = kingdom === template.target_value;
              } else if (template.challenge_type === 'identify_count') {
                // Check if reached the count target
                currentProgress = todayCount;
                shouldComplete = todayCount >= targetValue;
              } else if (template.challenge_type === 'kingdom_diversity') {
                // Check if identified species from multiple kingdoms
                currentProgress = todayKingdoms.size;
                shouldComplete = todayKingdoms.size >= targetValue;
              }
              
              // Update progress
              await supabase
                .from('user_daily_challenges')
                .update({ 
                  progress: currentProgress
                })
                .eq('id', challenge.id);
              
              if (shouldComplete) {
                // Mark challenge as completed
                await supabase
                  .from('user_daily_challenges')
                  .update({ 
                    is_completed: true, 
                    completed_at: new Date().toISOString(),
                    progress: targetValue
                  })
                  .eq('id', challenge.id);
                
                // Award coins for challenge (also apply double coins if active)
                let challengeReward = template.coin_reward;
                
                // Check for double coins boost again for challenge reward
                try {
                  const now = new Date().toISOString();
                  const { data: activePurchases } = await serviceSupabase
                    .from('user_purchases')
                    .select('*, shop_items(*)')
                    .eq('user_id', user.id)
                    .eq('is_active', true);
                  
                  if (activePurchases) {
                    for (const purchase of activePurchases) {
                      if (purchase.shop_items?.category === 'boost') {
                        const metadata = purchase.shop_items.metadata as Record<string, unknown>;
                        if (metadata?.boost_type === 'double_coins') {
                          if (!purchase.expires_at || new Date(purchase.expires_at) > new Date(now)) {
                            challengeReward *= 2;
                            break;
                          }
                        }
                      }
                    }
                  }
                } catch (boostErr) {
                  console.error("Error checking boosts for challenge:", boostErr);
                }
                
                // Get or create user coins record
                const { data: coinData } = await serviceSupabase
                  .from('user_coins')
                  .select('balance')
                  .eq('user_id', user.id)
                  .maybeSingle();
                
                if (coinData) {
                  await serviceSupabase
                    .from('user_coins')
                    .update({ 
                      balance: coinData.balance + challengeReward,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);
                } else {
                  await serviceSupabase
                    .from('user_coins')
                    .insert({ 
                      user_id: user.id, 
                      balance: challengeReward 
                    });
                }
                
                console.log(`Challenge completed: ${template.name}, awarded ${challengeReward} coins`);
              }
            }
          }
        } catch (challengeErr) {
          console.error("Error processing daily challenges:", challengeErr);
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
              description: `Location where ${result.name} was found`,
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

    // Return result with isNewSpecies flag
    return new Response(
      JSON.stringify({ ...result, isNewSpecies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in identify-species function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
