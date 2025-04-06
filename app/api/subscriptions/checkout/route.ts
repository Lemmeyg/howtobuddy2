import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import { SubscriptionTier } from "@/lib/subscription";

const checkoutSchema = z.object({
  tier: z.enum([SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]),
});

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = createSupabaseServer();

  try {
    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logResponse("Subscription checkout error", {
        status: 401,
        duration: Date.now() - startTime,
        error: "Unauthorized",
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { tier } = checkoutSchema.parse(body);

    // Create checkout session
    const session = await createSubscriptionCheckoutSession(
      session.user.id,
      tier
    );

    logResponse("Subscription checkout initiated", {
      status: 200,
      duration: Date.now() - startTime,
      tier,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logResponse("Subscription checkout error", {
      status: 400,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 400 }
    );
  }
} 