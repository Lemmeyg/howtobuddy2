import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import {
  getUserSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
} from "@/lib/subscription-management";

const updateSchema = z.object({
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
  interval: z.enum(["monthly", "annual"]).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export async function GET() {
  const startTime = Date.now();
  const supabase = createSupabaseServer();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const subscription = await getUserSubscription(session.user.id);
    logResponse("GET /api/subscription", startTime, { subscription });
    return NextResponse.json(subscription);
  } catch (error) {
    logResponse("GET /api/subscription", startTime, { error }, true);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const startTime = Date.now();
  const supabase = createSupabaseServer();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates = updateSchema.parse(body);

    const subscription = await updateSubscription(session.user.id, updates);
    logResponse("PATCH /api/subscription", startTime, { subscription });
    return NextResponse.json(subscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logResponse("PATCH /api/subscription", startTime, { error }, true);
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    logResponse("PATCH /api/subscription", startTime, { error }, true);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = createSupabaseServer();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    if (action === "cancel") {
      const subscription = await cancelSubscription(session.user.id);
      logResponse("POST /api/subscription (cancel)", startTime, { subscription });
      return NextResponse.json(subscription);
    }

    if (action === "reactivate") {
      const subscription = await reactivateSubscription(session.user.id);
      logResponse("POST /api/subscription (reactivate)", startTime, { subscription });
      return NextResponse.json(subscription);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    logResponse("POST /api/subscription", startTime, { error }, true);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 