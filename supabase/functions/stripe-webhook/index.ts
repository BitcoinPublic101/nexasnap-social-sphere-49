
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response("Webhook signature missing", { status: 400 });
    }

    // Get the raw request body
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Handle specific event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { user_id, product_type } = session.metadata;
        
        // Handle different product types
        if (product_type.startsWith("premium_")) {
          const isYearly = product_type === "premium_yearly";
          const now = new Date();
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));
          
          // Update user's premium status
          await supabase
            .from("user_subscriptions")
            .upsert({
              user_id,
              subscription_type: "premium",
              subscription_tier: isYearly ? "yearly" : "monthly",
              is_active: true,
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              stripe_subscription_id: session.subscription,
              last_payment_at: now.toISOString(),
            });
            
          // Update user's profile to indicate premium status
          await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("id", user_id);
        }
        else if (product_type === "squad_subscription") {
          // Handle squad creator subscription
          const now = new Date();
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          
          await supabase
            .from("user_subscriptions")
            .upsert({
              user_id,
              subscription_type: "squad_creator",
              subscription_tier: "standard",
              is_active: true,
              started_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              stripe_subscription_id: session.subscription,
              last_payment_at: now.toISOString(),
            });
            
          // Update user's profile for squad creator status
          await supabase
            .from("profiles")
            .update({ is_squad_creator: true })
            .eq("id", user_id);
        }
        else if (product_type === "boost_post") {
          // Handle one-time post boost purchase
          if (session.payment_status === "paid") {
            // Post ID should be included in additional metadata
            const postId = session.metadata.post_id;
            if (postId) {
              await supabase
                .from("post_boosts")
                .insert({
                  post_id: postId,
                  user_id,
                  created_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                  is_active: true,
                });
                
              // Update post boost status
              await supabase
                .from("posts")
                .update({ is_boosted: true })
                .eq("id", postId);
            }
          }
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        
        // Update subscription expiry date
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata.user_id;
          
          if (userId) {
            const expiresAt = new Date(subscription.current_period_end * 1000);
            
            await supabase
              .from("user_subscriptions")
              .update({
                is_active: true,
                expires_at: expiresAt.toISOString(),
                last_payment_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", invoice.subscription);
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        
        if (userId) {
          // Deactivate the subscription
          await supabase
            .from("user_subscriptions")
            .update({
              is_active: false,
              cancelled_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
            
          // Check subscription type and update user profile accordingly
          const { data: subData } = await supabase
            .from("user_subscriptions")
            .select("subscription_type")
            .eq("stripe_subscription_id", subscription.id)
            .single();
            
          if (subData) {
            if (subData.subscription_type === "premium") {
              await supabase
                .from("profiles")
                .update({ is_premium: false })
                .eq("id", userId);
            } 
            else if (subData.subscription_type === "squad_creator") {
              await supabase
                .from("profiles")
                .update({ is_squad_creator: false })
                .eq("id", userId);
            }
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
