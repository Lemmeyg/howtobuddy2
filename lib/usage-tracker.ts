import { createClient } from "@supabase/supabase-js";
import { SubscriptionTier } from "./subscription";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function trackDocumentCreation(userId: string) {
  const { data: usage, error: fetchError } = await supabase
    .from("usage_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching usage stats:", fetchError);
    return;
  }

  const { error: updateError } = await supabase
    .from("usage_stats")
    .upsert({
      user_id: userId,
      documents_this_month: (usage?.documents_this_month || 0) + 1,
      last_updated: new Date().toISOString(),
    });

  if (updateError) {
    console.error("Error updating usage stats:", updateError);
  }
}

export async function trackVideoProcessing(
  userId: string,
  duration: number
) {
  const { data: usage, error: fetchError } = await supabase
    .from("usage_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching usage stats:", fetchError);
    return;
  }

  const { error: updateError } = await supabase
    .from("usage_stats")
    .upsert({
      user_id: userId,
      videos_this_month: (usage?.videos_this_month || 0) + 1,
      total_duration_this_month:
        (usage?.total_duration_this_month || 0) + duration,
      last_updated: new Date().toISOString(),
    });

  if (updateError) {
    console.error("Error updating usage stats:", updateError);
  }
}

export async function resetMonthlyUsage() {
  const { error } = await supabase
    .from("usage_stats")
    .update({
      documents_this_month: 0,
      videos_this_month: 0,
      total_duration_this_month: 0,
      last_updated: new Date().toISOString(),
    })
    .lt("last_updated", new Date(new Date().setDate(1)).toISOString());

  if (error) {
    console.error("Error resetting monthly usage:", error);
  }
}

export async function checkUsageLimits(userId: string) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!subscription) {
    return { canProceed: false, reason: "No subscription found" };
  }

  const { data: usage } = await supabase
    .from("usage_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!usage) {
    return { canProceed: true };
  }

  const limits = {
    [SubscriptionTier.FREE]: {
      documents: 5,
      videos: 5,
      duration: 60, // minutes
    },
    [SubscriptionTier.PRO]: {
      documents: 50,
      videos: 50,
      duration: 600, // minutes
    },
    [SubscriptionTier.ENTERPRISE]: {
      documents: 500,
      videos: 500,
      duration: 6000, // minutes
    },
  };

  const tierLimits = limits[subscription.tier];

  if (
    usage.documents_this_month >= tierLimits.documents ||
    usage.videos_this_month >= tierLimits.videos ||
    usage.total_duration_this_month >= tierLimits.duration
  ) {
    return {
      canProceed: false,
      reason: "Usage limits exceeded",
      limits: tierLimits,
      currentUsage: {
        documents: usage.documents_this_month,
        videos: usage.videos_this_month,
        duration: usage.total_duration_this_month,
      },
    };
  }

  return { canProceed: true };
} 