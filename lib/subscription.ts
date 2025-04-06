import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/logger";

export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export interface SubscriptionLimits {
  documentsPerMonth: number;
  maxVideoDuration: number;
  maxVideosPerMonth: number;
  features: string[];
}

export const subscriptionLimits: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.FREE]: {
    documentsPerMonth: 5,
    maxVideoDuration: 10 * 60, // 10 minutes
    maxVideosPerMonth: 5,
    features: [
      "Basic video processing",
      "Standard transcription quality",
      "Basic document formatting",
    ],
  },
  [SubscriptionTier.PRO]: {
    documentsPerMonth: 50,
    maxVideoDuration: 60 * 60, // 1 hour
    maxVideosPerMonth: 50,
    features: [
      "Advanced video processing",
      "High-quality transcription",
      "Advanced document formatting",
      "Custom templates",
      "Priority support",
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    documentsPerMonth: 1000,
    maxVideoDuration: 120 * 60, // 2 hours
    maxVideosPerMonth: 1000,
    features: [
      "Enterprise video processing",
      "Highest quality transcription",
      "Custom document formatting",
      "Custom templates",
      "Dedicated support",
      "API access",
      "Custom integrations",
    ],
  },
};

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: "active" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  documentsThisMonth: number;
  videosThisMonth: number;
  totalVideoDuration: number;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      logError("Error fetching user subscription", { userId, error });
      return null;
    }

    return data;
  } catch (error) {
    logError("Error in getUserSubscription", { userId, error });
    return null;
  }
}

export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  try {
    const supabase = createSupabaseServer();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, video_url, metadata")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (docError) {
      logError("Error fetching user documents", { userId, error: docError });
      return {
        documentsThisMonth: 0,
        videosThisMonth: 0,
        totalVideoDuration: 0,
      };
    }

    const videosThisMonth = documents.length;
    const totalVideoDuration = documents.reduce((total, doc) => {
      const duration = doc.metadata?.videoInfo?.duration || 0;
      return total + duration;
    }, 0);

    return {
      documentsThisMonth: videosThisMonth,
      videosThisMonth,
      totalVideoDuration,
    };
  } catch (error) {
    logError("Error in getUserUsageStats", { userId, error });
    return {
      documentsThisMonth: 0,
      videosThisMonth: 0,
      totalVideoDuration: 0,
    };
  }
}

export function canProcessDocument(
  tier: SubscriptionTier,
  currentUsage: UsageStats,
  videoDuration: number
): boolean {
  const limits = subscriptionLimits[tier];
  
  if (tier === SubscriptionTier.FREE) {
    return (
      currentUsage.documentsThisMonth < limits.documentsPerMonth &&
      currentUsage.videosThisMonth < limits.maxVideosPerMonth &&
      videoDuration <= limits.maxVideoDuration
    );
  }

  return videoDuration <= limits.maxVideoDuration;
}

export async function checkSubscriptionLimits(
  userId: string,
  videoDuration: number
): Promise<{ canProcess: boolean; reason?: string }> {
  try {
    const subscription = await getUserSubscription(userId);
    const usage = await getUserUsageStats(userId);

    if (!subscription) {
      return {
        canProcess: canProcessDocument(SubscriptionTier.FREE, usage, videoDuration),
        reason: "No active subscription",
      };
    }

    const canProcess = canProcessDocument(subscription.tier, usage, videoDuration);
    if (!canProcess) {
      const reason = `You have reached your monthly limit of ${
        subscriptionLimits[subscription.tier].documentsPerMonth
      } documents`;
      return { canProcess: false, reason };
    }

    return { canProcess: true };
  } catch (error) {
    logError("Error checking subscription limits", { userId, error });
    return {
      canProcess: false,
      reason: "Error checking subscription limits",
    };
  }
}

export const SubscriptionInterval = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
} as const;

export type SubscriptionInterval = typeof SubscriptionInterval[keyof typeof SubscriptionInterval];

export const subscriptionSchema = z.object({
  tier: z.enum([SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]),
  interval: z.enum([SubscriptionInterval.MONTHLY, SubscriptionInterval.ANNUAL]),
  status: z.enum(["active", "canceled", "past_due", "unpaid"]),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.string().datetime().nullable(),
  trialStart: z.string().datetime().nullable(),
  trialEnd: z.string().datetime().nullable(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export function getSubscriptionPrice(tier: SubscriptionTier, interval: SubscriptionInterval): number {
  const prices = {
    [SubscriptionTier.PRO]: {
      [SubscriptionInterval.MONTHLY]: 19,
      [SubscriptionInterval.ANNUAL]: 190, // 2 months free
    },
  };

  return prices[tier]?.[interval] ?? 0;
}

export function formatSubscriptionPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getSubscriptionFeatures(tier: SubscriptionTier) {
  return subscriptionLimits[tier].features;
}

export function getRemainingDocuments(
  tier: SubscriptionTier,
  currentUsage: number
): number | null {
  if (tier === SubscriptionTier.FREE) {
    return Math.max(0, subscriptionLimits[tier].documentsPerMonth - currentUsage);
  }
  return null; // Unlimited for Pro and Enterprise
}

export async function getSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
  try {
    const supabase = createSupabaseServer();
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    if (error) {
      logError(new Error('Failed to fetch subscription'), { userId, error });
      // Return free tier limits as default
      return subscriptionLimits[SubscriptionTier.FREE];
    }

    return subscriptionLimits[subscription?.tier || SubscriptionTier.FREE];
  } catch (error) {
    logError(new Error('Error getting subscription limits'), { userId, error });
    return subscriptionLimits[SubscriptionTier.FREE];
  }
} 