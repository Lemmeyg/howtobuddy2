import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Handle webhook requests
  if (request.nextUrl.pathname.startsWith("/api/transcribe/webhook")) {
    const webhookSecret = request.headers.get("x-webhook-auth");
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 }
      );
    }
    return res;
  }

  // Handle API requests
  if (request.nextUrl.pathname.startsWith("/api")) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // Handle auth routes
  if (request.nextUrl.pathname.startsWith("/auth")) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Handle dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/auth/:path*",
    "/dashboard/:path*",
  ],
}; 