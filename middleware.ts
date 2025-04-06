import { NextResponse, type NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { startPerformanceTransaction } from '@/lib/sentry'

// Create Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/_next',
  '/static',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  // Start performance monitoring
  const startTime = Date.now()
  let transaction
  
  try {
    transaction = startPerformanceTransaction('middleware')

    // Create a response object that we can modify
    const response = NextResponse.next()

    // Check if the request is for a public route
    const isPublicRoute = request.nextUrl.pathname.startsWith('/api/public') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/auth')

    // Apply rate limiting only to non-public routes
    if (!isPublicRoute) {
      const ip = request.ip ?? '127.0.0.1'
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)
      
      if (!success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
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

    // Initialize Supabase client
    const supabase = createMiddlewareClient({ req: request, res: response })
    
    // Check authentication for protected routes
    if (!isPublicRoute) {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('returnTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Check if user is trying to access auth pages while logged in
    if (request.nextUrl.pathname.startsWith('/auth')) {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (!error && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  } finally {
    // Log performance metrics
    const duration = Date.now() - startTime
    console.log(`Middleware execution time: ${duration}ms`)
    
    // Finish transaction if it exists
    if (transaction?.finish) {
      try {
        transaction.finish()
      } catch (error) {
        console.warn('Failed to finish transaction:', error)
      }
    }
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