"use client";

import { useState } from "react";
import { PricingCard } from "@/components/subscription/pricing-card";
import { SubscriptionTier, getUserSubscription } from "@/lib/subscription";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const PRICING = {
  [SubscriptionTier.FREE]: {
    monthly: 0,
    yearly: 0,
  },
  [SubscriptionTier.PRO]: {
    monthly: 29,
    yearly: 290, // 2 months free
  },
  [SubscriptionTier.ENTERPRISE]: {
    monthly: 99,
    yearly: 990, // 2 months free
  },
};

export default function SubscriptionPage() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();

  const handleSelectTier = async (tier: SubscriptionTier) => {
    if (tier === SubscriptionTier.FREE) {
      // Handle free tier selection
      try {
        setIsLoading(true);
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            tier: SubscriptionTier.FREE,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ).toISOString(),
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Your subscription has been updated.",
        });

        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update subscription. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle paid tier selection
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .single();

      if (error) throw error;

      // Redirect to Stripe checkout
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          interval,
          customerId: data?.stripe_customer_id,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-2">
          Choose the plan that best fits your needs.
        </p>
      </div>

      <Tabs
        defaultValue="month"
        onValueChange={(value) => setInterval(value as "month" | "year")}
      >
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly (Save 20%)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={interval}>
          <div className="grid gap-8 md:grid-cols-3">
            <PricingCard
              tier={SubscriptionTier.FREE}
              price={PRICING[SubscriptionTier.FREE][interval]}
              interval={interval}
              currentTier={currentTier}
              onSelect={handleSelectTier}
            />
            <PricingCard
              tier={SubscriptionTier.PRO}
              price={PRICING[SubscriptionTier.PRO][interval]}
              interval={interval}
              isPopular
              currentTier={currentTier}
              onSelect={handleSelectTier}
            />
            <PricingCard
              tier={SubscriptionTier.ENTERPRISE}
              price={PRICING[SubscriptionTier.ENTERPRISE][interval]}
              interval={interval}
              currentTier={currentTier}
              onSelect={handleSelectTier}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Current Usage</h2>
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Documents This Month
              </h3>
              <p className="text-2xl font-bold">0/5</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Videos This Month
              </h3>
              <p className="text-2xl font-bold">0/5</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Video Duration
              </h3>
              <p className="text-2xl font-bold">0 min</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 