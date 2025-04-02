
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
    // Get environment variables and validate them
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY");
      throw new Error("Server configuration error");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Retrieve user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error("User authentication error:", userError);
      throw new Error("Authentication failed");
    }
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log(`Checking subscription for user: ${user.id}`);

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
      console.error("Subscription query error:", subscriptionError);
      throw subscriptionError;
    }
    
    // Check if user is premium (may be set directly without subscription)
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_premium, is_squad_creator")
      .eq("id", user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error("Profile query error:", profileError);
      throw profileError;
    }
    
    let userProfileData = {
      is_premium: false,
      is_squad_creator: false
    };
    
    if (profileData) {
      userProfileData = profileData;
    } else {
      console.warn(`No profile found for user ${user.id}`);
    }
    
    const now = new Date();
    const hasActiveSubscription = subscriptionData && 
      new Date(subscriptionData.expires_at) > now;
    
    console.log(`User ${user.id} subscription status: active=${hasActiveSubscription}, premium=${userProfileData.is_premium}`);

    return new Response(
      JSON.stringify({
        isPremium: userProfileData.is_premium || (hasActiveSubscription && subscriptionData.subscription_type === "premium"),
        isSquadCreator: userProfileData.is_squad_creator || (hasActiveSubscription && subscriptionData.subscription_type === "squad_creator"),
        subscription: subscriptionData || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred while checking subscription",
        success: false
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.status || 500,
      }
    );
  }
});
