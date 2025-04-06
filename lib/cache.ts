import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Cache interface
interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

// Cache key generator
const generateCacheKey = (key: string, tags?: string[]) => {
  if (!tags?.length) return key
  return `${key}:${tags.join(':')}`
}

// Cache service
export const cache = {
  // Get cached value
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key)
      return value
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  // Set cached value
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = generateCacheKey(key, options.tags)
      if (options.ttl) {
        await redis.setex(cacheKey, options.ttl, value)
      } else {
        await redis.set(cacheKey, value)
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  // Delete cached value
  async delete(key: string, tags?: string[]): Promise<void> {
    try {
      const cacheKey = generateCacheKey(key, tags)
      await redis.del(cacheKey)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  },

  // Invalidate cache by tag
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await redis.keys(`*:${tag}:*`)
      if (keys.length) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  },

  // Clear all cache
  async clear(): Promise<void> {
    try {
      await redis.flushall()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  },
}

// Cache wrapper for API routes
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = await cache.get<T>(key)
  if (cached) return cached

  // Execute the function if not in cache
  const result = await fn()

  // Store in cache
  await cache.set(key, result, options)

  return result
} 