import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import { Subscription, SubscriptionTier, SubscriptionInterval, subscriptionSchema } from "./subscription";
import { z } from "zod";

const subscriptionUpdateSchema = z.object({
  tier: z.enum([SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]).optional(),
  interval: z.enum([SubscriptionInterval.MONTHLY, SubscriptionInterval.ANNUAL]).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();

  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return subscriptionSchema.parse(subscription);
  } catch (error) {
    logError("Error fetching user subscription", { userId, error });
    throw error;
  }
}

export async function updateSubscription(
  userId: string,
  updates: z.infer<typeof subscriptionUpdateSchema>
): Promise<Subscription> {
  const supabase = createClient();

  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const updatedSubscription = subscriptionSchema.parse(subscription);
    logInfo("Subscription updated", { userId, updates });
    return updatedSubscription;
  } catch (error) {
    logError("Error updating subscription", { userId, updates, error });
    throw error;
  }
}

export async function cancelSubscription(userId: string): Promise<Subscription> {
  const supabase = createClient();

  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .update({
        cancelAtPeriodEnd: true,
        canceledAt: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const updatedSubscription = subscriptionSchema.parse(subscription);
    logInfo("Subscription cancelled", { userId });
    return updatedSubscription;
  } catch (error) {
    logError("Error cancelling subscription", { userId, error });
    throw error;
  }
}

export async function reactivateSubscription(userId: string): Promise<Subscription> {
  const supabase = createClient();

  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .update({
        cancelAtPeriodEnd: false,
        canceledAt: null,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    const updatedSubscription = subscriptionSchema.parse(subscription);
    logInfo("Subscription reactivated", { userId });
    return updatedSubscription;
  } catch (error) {
    logError("Error reactivating subscription", { userId, error });
    throw error;
  }
} 