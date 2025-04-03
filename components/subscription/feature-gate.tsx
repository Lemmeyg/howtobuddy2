"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SubscriptionTier, getSubscriptionFeatures } from "@/lib/subscription";

interface FeatureGateProps {
  feature: keyof ReturnType<typeof getSubscriptionFeatures>;
  tier: SubscriptionTier;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, tier, children, fallback }: FeatureGateProps) {
  const router = useRouter();
  const features = getSubscriptionFeatures(tier);
  const hasAccess = features[feature];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <h3 className="text-lg font-semibold">Upgrade Required</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This feature is only available with a Pro subscription.
      </p>
      <Button
        className="mt-4"
        onClick={() => router.push("/pricing")}
      >
        View Plans
      </Button>
    </div>
  );
}

export function useFeatureGate(tier: SubscriptionTier) {
  const features = getSubscriptionFeatures(tier);

  return {
    hasFeature: (feature: keyof typeof features) => features[feature],
    features,
  };
} 