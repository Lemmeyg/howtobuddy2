import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import { SubscriptionTier, getSubscriptionLimits } from "./subscription";
import { z } from "zod";
import { usageSchema } from "@/lib/validations/schemas";
import type { SubscriptionUsage } from "@/lib/types";

const usageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  documents_processed: z.number(),
  total_video_duration: z.number(),
  last_reset: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SubscriptionUsage = z.infer<typeof usageSchema>;

export async function getUserUsage(userId: string): Promise<SubscriptionUsage | null> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: usage, error } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return usageSchema.parse(usage);
  } catch (error) {
    logError("Error fetching user usage", { userId, error });
    throw error;
  }
}

export async function incrementUsage(
  userId: string,
  subscriptionId: string,
  videoDuration: number
): Promise<SubscriptionUsage> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: usage, error } = await supabase.rpc("increment_subscription_usage", {
      p_user_id: userId,
      p_subscription_id: subscriptionId,
      p_video_duration: videoDuration,
    });

    if (error) throw error;

    const updatedUsage = usageSchema.parse(usage);
    logInfo("Usage incremented", { userId, videoDuration });
    return updatedUsage;
  } catch (error) {
    logError("Error incrementing usage", { userId, videoDuration, error });
    throw error;
  }
}

export async function resetUsage(userId: string, subscriptionId: string): Promise<SubscriptionUsage> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: usage, error } = await supabase
      .from("subscription_usage")
      .update({
        documents_processed: 0,
        total_video_duration: 0,
        last_reset: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("subscription_id", subscriptionId)
      .select()
      .single();

    if (error) throw error;

    const updatedUsage = usageSchema.parse(usage);
    logInfo("Usage reset", { userId });
    return updatedUsage;
  } catch (error) {
    logError("Error resetting usage", { userId, subscriptionId, error });
    throw error;
  }
}

export async function checkUsageLimit(
  userId: string,
  tier: SubscriptionTier,
  videoDuration: number
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: usage, error } = await supabase
      .from("subscription_usage")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    const limits = getSubscriptionLimits(tier);
    const now = new Date();
    const lastReset = new Date(usage.last_reset);

    // Check if we need to reset usage (monthly)
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await resetUsage(userId, usage.subscription_id);
      return true;
    }

    // Check if user has exceeded limits
    if (tier === SubscriptionTier.FREE) {
      return (
        usage.documents_processed < limits.documentsPerMonth &&
        usage.total_video_duration + videoDuration <= limits.maxVideoDuration
      );
    }

    return usage.total_video_duration + videoDuration <= limits.maxVideoDuration;
  } catch (error) {
    logError("Error checking usage limit", { userId, tier, videoDuration, error });
    throw error;
  }
} 