"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Subscription, SubscriptionTier, SubscriptionInterval } from "@/lib/subscription";
import { SubscriptionUsage } from "@/lib/subscription-usage";
import { formatSubscriptionPrice, getSubscriptionPrice } from "@/lib/subscription";
import { getSubscriptionLimits } from "@/lib/subscription";

export function SubscriptionSettings() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  async function fetchSubscriptionData() {
    try {
      const [subscriptionRes, usageRes] = await Promise.all([
        fetch("/api/subscription"),
        fetch("/api/subscription/usage"),
      ]);

      if (!subscriptionRes.ok || !usageRes.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const [subscriptionData, usageData] = await Promise.all([
        subscriptionRes.json(),
        usageRes.json(),
      ]);

      setSubscription(subscriptionData);
      setUsage(usageData);
    } catch (error) {
      setError("Failed to load subscription data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelSubscription() {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      setError("Failed to cancel subscription");
      console.error(error);
    }
  }

  async function handleReactivateSubscription() {
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      setError("Failed to reactivate subscription");
      console.error(error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You are currently on the free plan. Upgrade to access more features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/pricing")}>
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  const limits = getSubscriptionLimits(subscription.tier);
  const price = getSubscriptionPrice(subscription.tier, subscription.interval);
  const formattedPrice = formatSubscriptionPrice(price);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {subscription.tier === SubscriptionTier.FREE
              ? "Free Plan"
              : `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Billing Interval</p>
              <p className="text-sm text-muted-foreground">
                {subscription.interval === SubscriptionInterval.MONTHLY
                  ? "Monthly"
                  : "Annual"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Price</p>
              <p className="text-sm text-muted-foreground">
                {formattedPrice}/
                {subscription.interval === SubscriptionInterval.MONTHLY
                  ? "month"
                  : "year"}
              </p>
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Cancellation Scheduled</AlertTitle>
                <AlertDescription>
                  Your subscription will be cancelled at the end of the current billing period.
                </AlertDescription>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleReactivateSubscription}
                >
                  Reactivate Subscription
                </Button>
              </Alert>
            ) : (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {subscription.tier === SubscriptionTier.FREE && usage && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>
              Your usage for the current billing period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Documents Processed</p>
                  <p className="text-sm text-muted-foreground">
                    {usage.documents_processed} / {limits.documentsPerMonth}
                  </p>
                </div>
                <Progress
                  value={(usage.documents_processed / limits.documentsPerMonth) * 100}
                  className="mt-2"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Video Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(usage.total_video_duration / 60)} /{" "}
                    {Math.round(limits.maxVideoDuration / 60)} minutes
                  </p>
                </div>
                <Progress
                  value={(usage.total_video_duration / limits.maxVideoDuration) * 100}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            Features available in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Object.entries(limits.features).map(([feature, enabled]) => (
              <li
                key={feature}
                className="flex items-center space-x-2"
              >
                {enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">
                  {feature
                    .split(/(?=[A-Z])/)
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 