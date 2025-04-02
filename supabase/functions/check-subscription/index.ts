
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has an active subscription
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    // Check if user is premium (may be set directly without subscription)
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_premium, is_squad_creator")
      .eq("id", user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    const now = new Date();
    const hasActiveSubscription = subscriptionData && 
      new Date(subscriptionData.expires_at) > now;
    
    return new Response(
      JSON.stringify({
        isPremium: profileData.is_premium || (hasActiveSubscription && subscriptionData.subscription_type === "premium"),
        isSquadCreator: profileData.is_squad_creator || (hasActiveSubscription && subscriptionData.subscription_type === "squad_creator"),
        subscription: subscriptionData || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.status || 500,
      }
    );
  }
});
