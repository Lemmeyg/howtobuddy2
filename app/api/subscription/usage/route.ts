import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { getUserUsage } from "@/lib/subscription-usage";

export async function GET() {
  const startTime = Date.now();
  const supabase = getSupabaseServerClient();

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

    const usage = await getUserUsage(session.user.id);
    logResponse("GET /api/subscription/usage", startTime, { usage });
    return NextResponse.json(usage);
  } catch (error) {
    logResponse("GET /api/subscription/usage", startTime, { error }, true);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 