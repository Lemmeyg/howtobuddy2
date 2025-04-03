import { z } from "zod";

export const SubscriptionTier = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

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

export const subscriptionLimits = {
  [SubscriptionTier.FREE]: {
    documentsPerMonth: 5,
    maxVideoDuration: 30 * 60, // 30 minutes
    features: {
      transcription: true,
      summary: true,
      sentimentAnalysis: false,
      topicAnalysis: false,
      customTemplates: false,
      apiAccess: false,
    },
  },
  [SubscriptionTier.PRO]: {
    documentsPerMonth: Infinity,
    maxVideoDuration: 120 * 60, // 2 hours
    features: {
      transcription: true,
      summary: true,
      sentimentAnalysis: true,
      topicAnalysis: true,
      customTemplates: true,
      apiAccess: true,
    },
  },
  [SubscriptionTier.ENTERPRISE]: {
    documentsPerMonth: Infinity,
    maxVideoDuration: Infinity,
    features: {
      transcription: true,
      summary: true,
      sentimentAnalysis: true,
      topicAnalysis: true,
      customTemplates: true,
      apiAccess: true,
    },
  },
} as const;

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

export function canProcessDocument(
  tier: SubscriptionTier,
  currentUsage: number,
  videoDuration: number
): boolean {
  const limits = subscriptionLimits[tier];
  
  if (tier === SubscriptionTier.FREE) {
    return (
      currentUsage < limits.documentsPerMonth &&
      videoDuration <= limits.maxVideoDuration
    );
  }

  return videoDuration <= limits.maxVideoDuration;
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