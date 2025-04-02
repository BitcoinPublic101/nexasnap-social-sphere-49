
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, contentId, contentType } = await req.json();
    
    if (!content || !contentType) {
      return new Response(
        JSON.stringify({ error: "Content and contentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check content for policy violations using Gemini
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Check if the following content violates community guidelines for social media. 
                Return a JSON object with these fields:
                - isSafe (boolean): true if content is safe, false if it violates guidelines
                - reasons (array): if not safe, list the specific violations (hate speech, harassment, explicit content, etc.)
                - severity (string): "low", "medium", or "high" indicating violation severity
                
                Content to check: "${content}"`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error checking content");
    }
    
    // Extract the moderation result from the Gemini response
    const generatedText = data.candidates[0].content.parts[0].text;
    let moderationResult;
    
    try {
      // Extract JSON from the generated text (handle potential text wrapping)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid moderation result format");
      }
    } catch (parseError) {
      console.error("Error parsing moderation result:", parseError);
      moderationResult = { 
        isSafe: true, 
        reasons: ["Error parsing moderation result"],
        severity: "low"
      };
    }
    
    // Flag content if it violates guidelines
    if (!moderationResult.isSafe && contentId) {
      if (contentType === 'post') {
        await supabase
          .from('posts')
          .update({ is_flagged: true })
          .eq('id', contentId);
      } else if (contentType === 'comment') {
        await supabase
          .from('comments')
          .update({ is_hidden: true })
          .eq('id', contentId);
      }
      
      // Add to moderation queue
      await supabase
        .from('content_reports')
        .insert({
          content_id: contentId,
          content_type: contentType,
          reason: `AI Flagged: ${moderationResult.reasons.join(', ')}`,
          status: 'pending',
          reporter_id: '00000000-0000-0000-0000-000000000000', // System reporter ID
          created_at: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify({ 
        isSafe: moderationResult.isSafe,
        reasons: moderationResult.reasons || [],
        severity: moderationResult.severity || "low" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in content moderation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
