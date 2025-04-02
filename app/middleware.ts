import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected, /login)
  const path = request.nextUrl.pathname;

  // Create a response object to modify
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public routes that don't require authentication
  const isPublicRoute = path === "/" || 
                       path === "/login" || 
                       path === "/register" || 
                       path === "/reset-password" ||
                       path === "/api/test" ||  // Add test API endpoint as public
                       path.startsWith("/_next") || 
                       path.includes(".");

  // Check auth condition
  if (!session && !isPublicRoute) {
    // Redirect to login page if accessing protected route without session
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && (path === "/login" || path === "/register" || path === "/reset-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Only apply rate limiting to API routes
  if (!path.startsWith("/api/")) {
    return res;
  }

  const ip = request.ip ?? "127.0.0.1";
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of rateLimit.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      rateLimit.delete(key);
    }
  }

  // Get or create rate limit entry
  const rateLimitEntry = rateLimit.get(ip);
  if (!rateLimitEntry) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return res;
  }

  // Check if within window
  if (now - rateLimitEntry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return res;
  }

  // Check if exceeded limit
  if (rateLimitEntry.count >= MAX_REQUESTS) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  // Increment counter
  rateLimitEntry.count++;
  return res;
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}; 