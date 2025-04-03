import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { headers } from "next/headers";
import Stripe from "stripe";
import { SubscriptionTier, SubscriptionInterval } from "@/lib/subscription";
import { updateSubscription } from "@/lib/subscription-management";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const subscriptionTierMap: Record<string, SubscriptionTier> = {
  "price_free": SubscriptionTier.FREE,
  "price_pro_monthly": SubscriptionTier.PRO,
  "price_pro_annual": SubscriptionTier.PRO,
  "price_enterprise": SubscriptionTier.ENTERPRISE,
};

const subscriptionIntervalMap: Record<string, SubscriptionInterval> = {
  "price_free": SubscriptionInterval.MONTHLY,
  "price_pro_monthly": SubscriptionInterval.MONTHLY,
  "price_pro_annual": SubscriptionInterval.ANNUAL,
  "price_enterprise": SubscriptionInterval.MONTHLY,
};

export async function POST(request: Request) {
  const startTime = Date.now();
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logResponse("POST /api/webhooks/stripe", startTime, { error: "No signature" }, true);
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    const supabase = createClient();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const priceId = subscription.items.data[0].price.id;

        // Get user ID from metadata
        const userId = customer.metadata.userId;
        if (!userId) {
          throw new Error("No user ID in customer metadata");
        }

        // Update subscription in database
        await updateSubscription(userId, {
          tier: subscriptionTierMap[priceId],
          interval: subscriptionIntervalMap[priceId],
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        });

        logResponse("POST /api/webhooks/stripe", startTime, {
          event: event.type,
          subscriptionId: subscription.id,
          userId,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = customer.metadata.userId;

        if (!userId) {
          throw new Error("No user ID in customer metadata");
        }

        // Update subscription status to canceled
        await updateSubscription(userId, {
          status: "canceled",
          canceledAt: new Date(subscription.canceled_at! * 1000).toISOString(),
        });

        logResponse("POST /api/webhooks/stripe", startTime, {
          event: event.type,
          subscriptionId: subscription.id,
          userId,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = customer.metadata.userId;

        if (!userId) {
          throw new Error("No user ID in customer metadata");
        }

        // Update subscription status to active
        await updateSubscription(userId, {
          status: "active",
        });

        logResponse("POST /api/webhooks/stripe", startTime, {
          event: event.type,
          subscriptionId: subscription.id,
          userId,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = customer.metadata.userId;

        if (!userId) {
          throw new Error("No user ID in customer metadata");
        }

        // Update subscription status to past_due
        await updateSubscription(userId, {
          status: "past_due",
        });

        logResponse("POST /api/webhooks/stripe", startTime, {
          event: event.type,
          subscriptionId: subscription.id,
          userId,
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logResponse("POST /api/webhooks/stripe", startTime, { error }, true);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
} 