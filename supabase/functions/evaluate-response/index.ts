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
    const { question, answer, questionType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create evaluation prompt based on question type
    let evaluationPrompt = "";
    
    if (questionType === "open-ended") {
      evaluationPrompt = `Evaluate this response to the question: "${question}"

Response: "${answer}"

Rate the quality of this response on a scale from 50 to 100 XP based on:
- Thoughtfulness and depth (how well they articulated their thoughts)
- Relevance to the question
- Clarity and coherence
- Constructiveness and actionability

Return ONLY a JSON object with this exact format:
{"xp": <number between 50-100>, "reason": "<brief 1-sentence explanation>"}`;
    } else if (questionType === "ideation") {
      evaluationPrompt = `Evaluate these brainstorming ideas for the question: "${question}"

Ideas submitted: ${answer}

Rate the quality of these ideas on a scale from 50 to 100 XP based on:
- Creativity and originality
- Relevance to the question
- Practicality and feasibility
- Number and diversity of ideas

Return ONLY a JSON object with this exact format:
{"xp": <number between 50-100>, "reason": "<brief 1-sentence explanation>"}`;
    } else {
      // For multiple choice, yes/no, ranking - give standard XP
      return new Response(
        JSON.stringify({ xp: 50, reason: "Response recorded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
            content: "You are an expert evaluator of survey responses. You provide fair, constructive feedback and assign XP scores between 50-100 based on response quality. Always return valid JSON."
          },
          {
            role: "user",
            content: evaluationPrompt
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
    const evaluationText = data.choices[0].message.content;
    
    console.log("AI evaluation response:", evaluationText);
    
    // Parse the JSON response
    const evaluation = JSON.parse(evaluationText);
    
    // Ensure XP is within bounds
    const xp = Math.max(50, Math.min(100, evaluation.xp));
    
    return new Response(
      JSON.stringify({ xp, reason: evaluation.reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in evaluate-response function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
