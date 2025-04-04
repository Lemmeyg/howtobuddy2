import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.json();
  const { event, session } = formData;

  if (event !== "SIGNED_IN" || !session) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Set the session
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });

  return NextResponse.json({ message: "Session updated" });
} 