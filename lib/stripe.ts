import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import { SubscriptionTier } from "@/lib/types";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const subscriptionPlans = {
  [SubscriptionTier.PRO]: {
    name: "Pro",
    price: 29,
    interval: "month",
    features: [
      "100 monthly credits",
      "Up to 2-hour videos",
      "Advanced analysis",
      "Priority support",
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: "Enterprise",
    price: 99,
    interval: "month",
    features: [
      "1000 monthly credits",
      "Up to 6-hour videos",
      "All analysis features",
      "Custom solutions",
      "Dedicated support",
    ],
  },
} as const;

export async function createCheckoutSession(userId: string, tier: SubscriptionTier) {
  const supabase = getSupabaseServerClient();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    let { stripe_customer_id } = profile;

    // Create or get Stripe customer
    if (!stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          userId,
        },
      });
      stripe_customer_id = customer.id;

      // Update user profile with Stripe customer ID
      await supabase
        .from("profiles")
        .update({ stripe_customer_id })
        .eq("id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripe_customer_id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env[`STRIPE_${tier}_PRICE_ID`],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        userId,
        tier,
      },
    });

    return session;
  } catch (error) {
    logError("Error creating checkout session", { userId, tier, error });
    throw error;
  }
}

export async function createBillingPortalSession(userId: string) {
  const supabase = getSupabaseServerClient();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      throw new Error("No Stripe customer found");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return session;
  } catch (error) {
    logError("Error creating billing portal session", { userId, error });
    throw error;
  }
}

export async function handleSubscriptionChange(
  subscription: any,
  customerId: string
) {
  const supabase = getSupabaseServerClient();

  try {
    // Get user by Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile) {
      throw new Error("User not found");
    }

    // Update subscription in database
    await supabase
      .from("subscriptions")
      .update({
        status: subscription.status,
        tier: subscription.metadata.tier,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq("user_id", profile.id);
  } catch (error) {
    logError("Error handling subscription change", { subscription, customerId, error });
    throw error;
  }
} 