import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SubscriptionTier } from "@/lib/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const PRICE_IDS = {
  [SubscriptionTier.PRO]: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  [SubscriptionTier.ENTERPRISE]: {
    month: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID!,
    year: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID!,
  },
};

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tier, interval, customerId } = await request.json();

    if (!tier || !interval || !PRICE_IDS[tier]?.[interval]) {
      return NextResponse.json(
        { error: "Invalid subscription parameters" },
        { status: 400 }
      );
    }

    let stripeCustomerId = customerId;

    if (!stripeCustomerId) {
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          supabase_user_id: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store the Stripe customer ID in Supabase
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: session.user.id,
          stripe_customer_id: stripeCustomerId,
        });
    }

    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[tier][interval],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        tier,
        interval,
        supabase_user_id: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 