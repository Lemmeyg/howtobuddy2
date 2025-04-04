import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export async function middleware(request: NextRequest) {
  console.log('🚨 Middleware Execution Started 🚨');
  
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  console.log('🛣️ Middleware - Path:', path);

  // Create a response object to modify
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  console.log('🔧 Middleware - Supabase client created');

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('🔒 Middleware - Session state:', {
    hasSession: !!session,
    hasError: !!error,
    userId: session?.user?.id,
    path: path,
    timestamp: new Date().toISOString()
  });

  // Public routes that don't require authentication
  const isPublicRoute = path === "/" || 
                       path === "/login" || 
                       path === "/register" || 
                       path === "/reset-password" ||
                       path === "/api/test" ||  // Add test API endpoint as public
                       path.startsWith("/_next") || 
                       path.includes(".");

  console.log('🚪 Middleware - Route access:', {
    path,
    isPublicRoute,
    hasSession: !!session,
    willRedirect: !session && !isPublicRoute,
    timestamp: new Date().toISOString()
  });

  // Check auth condition
  if (!session && !isPublicRoute) {
    console.log('🚫 Middleware - Redirecting to login due to no session');
    // Redirect to login page if accessing protected route without session
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && (path === "/login" || path === "/register" || path === "/reset-password")) {
    console.log('↪️ Middleware - Redirecting authenticated user to dashboard');
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  console.log('✅ Middleware - Request proceeding normally');
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