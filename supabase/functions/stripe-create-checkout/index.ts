
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { productType } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if user already has a Stripe customer ID
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profileData?.stripe_customer_id;

    // If no customer ID exists, create a new customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.username,
      });
      
      customerId = customer.id;
      
      // Save customer ID to profile
      await supabaseClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Configure checkout session based on product type
    let priceData;
    let mode: "payment" | "subscription" = "subscription";
    let productName;

    switch (productType) {
      case "premium_monthly":
        productName = "Premium Membership - Monthly";
        priceData = {
          currency: "usd",
          unit_amount: 999, // $9.99
          recurring: { interval: "month" },
          product_data: { name: productName },
        };
        break;
      case "premium_yearly":
        productName = "Premium Membership - Yearly";
        priceData = {
          currency: "usd",
          unit_amount: 9999, // $99.99
          recurring: { interval: "year" },
          product_data: { name: productName },
        };
        break;
      case "squad_subscription":
        productName = "Squad Creator Subscription";
        priceData = {
          currency: "usd",
          unit_amount: 599, // $5.99
          recurring: { interval: "month" },
          product_data: { name: productName },
        };
        break;
      case "boost_post":
        productName = "Boost Post";
        priceData = {
          currency: "usd",
          unit_amount: 499, // $4.99
          product_data: { name: productName },
        };
        mode = "payment";
        break;
      default:
        throw new Error("Invalid product type");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user.id,
        product_type: productType,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
