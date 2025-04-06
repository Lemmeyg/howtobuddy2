"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SubscriptionTier, subscriptionLimits } from "@/lib/subscription";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  tier: SubscriptionTier;
  price: number;
  interval: "month" | "year";
  isPopular?: boolean;
  currentTier?: SubscriptionTier;
  onSelect: (tier: SubscriptionTier) => void;
}

export function PricingCard({
  tier,
  price,
  interval,
  isPopular = false,
  currentTier,
  onSelect,
}: PricingCardProps) {
  const limits = subscriptionLimits[tier];
  const isCurrentTier = currentTier === tier;

  return (
    <Card
      className={cn(
        "relative p-6",
        isPopular && "border-primary shadow-lg",
        isCurrentTier && "border-green-500"
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold capitalize">{tier}</h3>
          <div className="mt-2">
            <span className="text-3xl font-bold">${price}</span>
            <span className="text-muted-foreground">/{interval}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {limits.documentsPerMonth} documents per month
          </p>
          <p className="text-sm text-muted-foreground">
            Up to {Math.floor(limits.maxVideoDuration / 60)} minutes per video
          </p>
        </div>

        <div className="space-y-2">
          {limits.features.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          onClick={() => onSelect(tier)}
          disabled={isCurrentTier}
        >
          {isCurrentTier ? "Current Plan" : "Select Plan"}
        </Button>
      </div>
    </Card>
  );
} 