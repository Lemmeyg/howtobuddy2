import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SubscriptionTier } from "@/lib/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier as SubscriptionTier;
        const interval = session.metadata?.interval as "month" | "year";

        if (!userId || !tier || !interval) {
          console.error("Missing metadata in checkout session");
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }

        // Update subscription in Supabase
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            tier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              new Date().setFullYear(
                new Date().getFullYear() + (interval === "year" ? 1 : 0)
              )
            ).toISOString(),
          });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get the user's Supabase ID from the customer metadata
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata?.supabase_user_id;

        if (!userId) {
          console.error("Missing user ID in customer metadata");
          return NextResponse.json(
            { error: "Missing user ID" },
            { status: 400 }
          );
        }

        // Update subscription status in Supabase
        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          });

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 