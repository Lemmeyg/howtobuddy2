import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Get the IP address of the request
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    
    // Apply rate limiting
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)
    
    // Test Redis connection by setting and getting a test key
    await redis.set('test_key', 'Hello from Upstash!')
    const testValue = await redis.get('test_key')
    
    // Return response with rate limit info and Redis test result
    return NextResponse.json({
      success,
      limit,
      reset,
      remaining,
      redisTest: {
        key: 'test_key',
        value: testValue,
        status: 'success'
      }
    }, { headers });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers }
    );
  }
} 