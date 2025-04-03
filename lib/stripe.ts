import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import { SubscriptionTier } from "./subscription";

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

export async function createStripeCustomer(userId: string, email: string) {
  const supabase = createClient();

  try {
    // Check if customer already exists
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_customer_id) {
      return subscription.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Update subscription with Stripe customer ID
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", userId);

    logInfo("Stripe customer created", { userId, customerId: customer.id });
    return customer.id;
  } catch (error) {
    logError("Error creating Stripe customer", { userId, error });
    throw error;
  }
}

export async function createSubscriptionCheckoutSession(
  userId: string,
  tier: keyof typeof subscriptionPlans
) {
  const supabase = createClient();

  try {
    // Get user email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    // Get or create Stripe customer
    const customerId = await createStripeCustomer(userId, user.email);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: subscriptionPlans[tier].name,
            },
            unit_amount: subscriptionPlans[tier].price * 100, // Convert to cents
            recurring: {
              interval: subscriptionPlans[tier].interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId,
        tier,
      },
    });

    logInfo("Checkout session created", { userId, sessionId: session.id });
    return session;
  } catch (error) {
    logError("Error creating checkout session", { userId, tier, error });
    throw error;
  }
}

export async function handleSubscriptionWebhook(event: Stripe.Event) {
  const supabase = createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as keyof typeof subscriptionPlans;

        if (!userId || !tier) {
          throw new Error("Missing required metadata");
        }

        // Update subscription
        await supabase
          .from("subscriptions")
          .update({
            tier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            ).toISOString(),
            stripe_subscription_id: session.subscription as string,
            cancel_at_period_end: false,
          })
          .eq("user_id", userId);

        logInfo("Subscription activated", { userId, tier });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          throw new Error("Missing required metadata");
        }

        // Update subscription status
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("user_id", userId);

        logInfo("Subscription updated", { userId, status: subscription.status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          throw new Error("Missing required metadata");
        }

        // Update subscription status
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("user_id", userId);

        logInfo("Subscription canceled", { userId });
        break;
      }
    }
  } catch (error) {
    logError("Error handling webhook", { event: event.type, error });
    throw error;
  }
} 