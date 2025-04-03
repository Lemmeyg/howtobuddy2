"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SubscriptionTier, SubscriptionInterval, getSubscriptionPrice, formatSubscriptionPrice } from "@/lib/subscription";

const plans = [
  {
    name: "Free",
    tier: SubscriptionTier.FREE,
    description: "Perfect for getting started",
    features: [
      "Up to 5 documents per month",
      "30-minute video limit",
      "Basic transcription",
      "Basic summary",
    ],
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    tier: SubscriptionTier.PRO,
    description: "For professionals who need more power",
    features: [
      "Unlimited documents",
      "2-hour video limit",
      "Advanced transcription",
      "Advanced summary",
      "Sentiment analysis",
      "Topic analysis",
      "Custom templates",
      "API access",
    ],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    tier: SubscriptionTier.ENTERPRISE,
    description: "For organizations with custom needs",
    features: [
      "Everything in Pro",
      "Unlimited video length",
      "Custom integrations",
      "Priority support",
      "Dedicated account manager",
      "SLA guarantees",
    ],
    buttonText: "Contact Sales",
    popular: false,
  },
];

export function SubscriptionPlans() {
  const [interval, setInterval] = useState<SubscriptionInterval>(SubscriptionInterval.MONTHLY);

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (tier === SubscriptionTier.ENTERPRISE) {
      window.location.href = "/contact";
      return;
    }

    const price = getSubscriptionPrice(tier, interval);
    // TODO: Implement Stripe checkout
    console.log("Subscribe to", tier, "plan for", formatSubscriptionPrice(price));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-8">
        <div className="relative self-center rounded-lg bg-muted p-0.5 flex self-center">
          <button
            type="button"
            className={`relative w-full rounded-md py-2 text-sm font-semibold whitespace-nowrap focus:outline-none focus:z-10 sm:w-auto sm:px-16 ${
              interval === SubscriptionInterval.MONTHLY
                ? "bg-background shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={() => setInterval(SubscriptionInterval.MONTHLY)}
          >
            Monthly billing
          </button>
          <button
            type="button"
            className={`relative w-full rounded-md py-2 text-sm font-semibold whitespace-nowrap focus:outline-none focus:z-10 sm:w-auto sm:px-16 ${
              interval === SubscriptionInterval.ANNUAL
                ? "bg-background shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={() => setInterval(SubscriptionInterval.ANNUAL)}
          >
            Annual billing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = getSubscriptionPrice(plan.tier, interval);
          const formattedPrice = formatSubscriptionPrice(price);

          return (
            <Card
              key={plan.tier}
              className={`relative flex flex-col p-6 ${
                plan.popular ? "border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold tracking-tight">{formattedPrice}</span>
                  <span className="text-sm text-muted-foreground">
                    /{interval === SubscriptionInterval.MONTHLY ? "month" : "year"}
                  </span>
                </p>
              </div>

              <ul className="mb-6 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="ml-3 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.tier)}
              >
                {plan.buttonText}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 