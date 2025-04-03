import { Metadata } from "next";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";

export const metadata: Metadata = {
  title: "Pricing - HowToBuddy",
  description: "Choose the perfect plan for your needs",
};

export default function PricingPage() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that best fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="mt-16">
          <SubscriptionPlans />
        </div>
      </div>
    </div>
  );
} 