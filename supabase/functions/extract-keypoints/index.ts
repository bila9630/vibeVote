import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionId, question } = await req.json();
    console.log('Extracting keypoints for question:', questionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all responses for this question
    const { data: responses, error: fetchError } = await supabase
      .from('user_responses')
      .select('response_text')
      .eq('question_id', questionId)
      .not('response_text', 'is', null);

    if (fetchError) {
      console.error('Error fetching responses:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch responses' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!responses || responses.length === 0) {
      console.log('No responses found');
      return new Response(JSON.stringify({ keypoints: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${responses.length} responses`);

    // Always regenerate keypoints to include new responses
    // Don't use cached keypoints to ensure latest data is represented

    // Extract keypoints using AI with frequency tracking
    const prompt = `Question: "${question}"

Here are all the responses from users:
${responses.map((r, i) => `${i + 1}. ${r.response_text}`).join('\n')}

Analyze these responses and extract the key themes. Return a JSON object where:
- Each key is a short theme name (1-3 words)
- Each value is the count of how many responses mention that theme

Group similar concepts together and count them. Make sure every response is represented by at least one theme.

Example format:
{
  "remote flexibility": 3,
  "health benefits": 2,
  "better communication": 1,
  "work-life balance": 4
}`;

    console.log('Calling AI gateway for keypoint extraction');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a data analysis assistant that extracts key themes and concepts from survey responses. Always return valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    console.log('AI response content:', content);

    // Parse keypoints with frequency from AI response
    let keypointsWithCount: { [key: string]: number } = {};
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedContent);
      
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        keypointsWithCount = parsed;
      } else {
        console.error('AI response is not an object with counts');
        keypointsWithCount = {};
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: create simple keypoints with count 1
      const matches = content.match(/"([^"]+)"/g);
      if (matches) {
        matches.forEach((m: string) => {
          const key = m.replace(/"/g, '');
          keypointsWithCount[key] = 1;
        });
      }
    }

    console.log(`Extracted ${Object.keys(keypointsWithCount).length} keypoints with frequencies`);

    // Save keypoints to database (delete old ones first)
    if (Object.keys(keypointsWithCount).length > 0) {
      // Get existing likes before deletion
      const { data: existingKeypoints } = await supabase
        .from('response_keypoints')
        .select('id, keypoint')
        .eq('question_id', questionId);

      const { data: likes } = await supabase
        .from('keypoint_likes')
        .select('keypoint_id');

      const likeCounts: { [key: string]: number } = {};
      if (likes && existingKeypoints) {
        existingKeypoints.forEach((kp) => {
          const likeCount = likes.filter(like => like.keypoint_id === kp.id).length;
          if (likeCount > 0) {
            likeCounts[kp.keypoint.toLowerCase()] = likeCount;
          }
        });
      }

      // Now delete existing keypoints for this question
      await supabase
        .from('response_keypoints')
        .delete()
        .eq('question_id', questionId);

      const keypointRecords = Object.entries(keypointsWithCount)
        .slice(0, 20)
        .map(([keypoint, count]) => ({
          question_id: questionId,
          keypoint: keypoint,
          response_count: count,
        }));

      const { data: savedKeypoints, error: saveError } = await supabase
        .from('response_keypoints')
        .insert(keypointRecords)
        .select();

      if (saveError) {
        console.error('Error saving keypoints:', saveError);
      } else {
        console.log('Saved keypoints to database');
        
        // Transfer likes to new keypoints with matching text
        if (savedKeypoints && Object.keys(likeCounts).length > 0) {
          for (const kp of savedKeypoints) {
            const matchedLikes = likeCounts[kp.keypoint.toLowerCase()] || 0;
            if (matchedLikes > 0) {
              // Create placeholder likes (in a real app, you'd need to track actual user IDs)
              const likesToInsert = Array.from({ length: matchedLikes }, (_, i) => ({
                keypoint_id: kp.id,
                user_id: crypto.randomUUID(),
              }));
              
              await supabase
                .from('keypoint_likes')
                .insert(likesToInsert);
            }
          }
        }

        const formattedKeypoints = (savedKeypoints || []).map((kp) => {
          const likeCount = likeCounts[kp.keypoint.toLowerCase()] || 0;
          return {
            id: kp.id,
            text: kp.keypoint,
            value: 20 + (kp.response_count * 15) + (likeCount * 10), // Base + frequency + likes
            likes: likeCount,
            count: kp.response_count,
          };
        });

        return new Response(JSON.stringify({ keypoints: formattedKeypoints }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ keypoints: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-keypoints function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
