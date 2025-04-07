import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter that allows 50 requests per minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '60 s'),
})

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/_next',
  '/static',
  '/favicon.ico',
  '/',
]

// List of routes that should be rate limited
const rateLimitedRoutes = [
  '/api/documents',
  '/api/transcribe',
  '/api/analyze',
]

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we can modify
    const response = NextResponse.next()

    // Initialize the Supabase client with the request and response
    const supabase = createMiddlewareClient({ req: request, res: response })

    // Refresh the session if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
    }

    // Check if the request is for a public route
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(route)
    )

    // Check if route should be rate limited
    const shouldRateLimit = rateLimitedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Apply rate limiting only to specific routes
    if (shouldRateLimit) {
      const ip = request.ip ?? '127.0.0.1'
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)
      
      if (!success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests. Please try again in a few minutes.',
            limit,
            reset,
            remaining,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          }
        )
      }

      // Add rate limit headers to the response
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())
    }

    // Set security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )
    
    // Check authentication for protected routes
    if (!isPublicRoute) {
      // Get the current session
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        // Store the current URL to redirect back after login
        const returnTo = encodeURIComponent(request.nextUrl.pathname)
        return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
      }
    }

    // Check if user is trying to access auth pages while logged in
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!error && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 