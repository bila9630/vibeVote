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
    const { question, responses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ 
          themes: [],
          dominantTrend: "No responses yet",
          feasibilityAnalysis: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisPrompt = `Analyze these responses to the question: "${question}"

All responses:
${responses.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

Your task:
1. Identify the dominant underlying trends/themes (e.g., health benefits vs gifts, time-saving vs comfort)
2. Group responses into 2-4 major themes with percentages
3. Provide a feasibility analysis for implementing these suggestions:
   - Pros (2-3 points)
   - Cons/Challenges (2-3 points)  
   - Easy to solve items (2-3 specific items)
   - Challenging items (2-3 specific items)
   - Overall realism score (1-10)

Return ONLY valid JSON in this exact format:
{
  "themes": [
    {
      "name": "Theme name",
      "description": "Brief description",
      "percentage": 45,
      "examples": ["example1", "example2"]
    }
  ],
  "dominantTrend": "One sentence describing the overall dominant direction",
  "feasibilityAnalysis": {
    "realismScore": 7,
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2", "Con 3"],
    "easySolutions": ["Easy item 1", "Easy item 2"],
    "challenges": ["Challenge 1", "Challenge 2"]
  }
}`;

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
            content: "You are an expert at analyzing survey data and identifying trends. Always return valid JSON only."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log("AI trend analysis response:", analysisText);
    
    // Clean up response - remove markdown code blocks if present
    const cleanedText = analysisText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const analysis = JSON.parse(cleanedText);
    
    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-trends function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});