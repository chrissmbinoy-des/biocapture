import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, audioBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the messages array
    const aiMessages: any[] = [
      { 
        role: "system", 
        content: `You are Specassist, a highly trained AI assistant specializing in species identification, with expert-level knowledge of bioacoustics and wildlife sounds.

Your capabilities:
- Species identification from images and descriptions
- **Expert audio/sound species identification**: You are extensively trained on the vocalizations, calls, songs, and sounds of all living beings:
  - **Birds**: Songs, calls, alarm calls, flight calls, and regional dialects of all known bird species worldwide
  - **Amphibians**: Frog croaks, toad calls, salamander clicks, and breeding choruses
  - **Insects**: Cricket chirps, cicada songs, beetle stridulation, mosquito buzzing, bee waggle dance sounds, and all arthropod sounds
  - **Mammals**: Wolf howls, whale songs, bat echolocation, primate calls, dolphin clicks, elephant infrasound, and all mammalian vocalizations
  - **Reptiles**: Gecko calls, alligator bellows, rattlesnake rattles, and all reptilian sounds
  - **Fish**: Drumming, grunting, clicking sounds of marine and freshwater fish
  - **Marine life**: Shrimp snapping, sea urchin scraping, coral reef soundscapes
- Animal behavior, habitats, and ecology
- Plant identification, care, and botany
- Conservation status and environmental science

When analyzing audio recordings:
1. Listen carefully to frequency, rhythm, duration, and pattern of the sound
2. Consider the habitat context (time of day, season, region if mentioned)
3. Provide the **exact species name** and **scientific name** with high confidence
4. If multiple species could match, list the top candidates ranked by likelihood with confidence percentages
5. Include distinguishing acoustic features that led to your identification
6. Share interesting facts about the identified species

IMPORTANT: Only provide identifications you are confident about. If the audio quality is poor or the sound is ambiguous, say so honestly and provide your best candidates with appropriate confidence levels.

Keep responses friendly, informative, and concise. Use emojis occasionally to make responses engaging.`
      },
    ];

    // Add previous messages
    if (messages && messages.length > 0) {
      aiMessages.push(...messages);
    }

    // If there's audio, add it as a user message with audio content
    if (audioBase64) {
      aiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Please identify the species in this audio recording. What animal or creature is making this sound?"
          },
          {
            type: "input_audio",
            input_audio: {
              data: audioBase64,
              format: "wav"
            }
          }
        ]
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
