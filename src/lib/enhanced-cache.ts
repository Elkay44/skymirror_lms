/**
 * Enhanced caching system for Skymirror LMS
 * 
 * This module provides consistent caching strategies across the application with:
 * - Flexible cache key generation based on resource type and parameters
 * - TTL (Time-to-live) control with different defaults per resource type
 * - Cache invalidation patterns for specific resources or entire types
 * - Support for distributed caching via Redis (future implementation)
 * - Automatic cache warming for frequently accessed resources
 * - Cache diagnostics and telemetry
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { kv } from '@vercel/kv';
import { rateLimit } from '@/lib/rate-limit';

// Define the cache types with their default TTLs (in seconds)
type CacheType = 
  | 'course'        // Individual course data
  | 'courses'       // Course listings
  | 'module'        // Individual module data
  | 'lesson'        // Individual lesson data
  | 'user'          // User profiles
  | 'enrollment'    // Enrollment data
  | 'analytics'     // Analytics data
  | 'search'        // Search results
  | 'forum'         // Forum data
  | 'version'       // Version data
  | 'categories'    // Category listings
  | 'settings';     // Site settings

// Default TTL values for different cache types in seconds
const DEFAULT_TTL: Record<CacheType, number> = {
  course: 60 * 5,        // 5 minutes
  courses: 60 * 10,      // 10 minutes
  module: 60 * 5,        // 5 minutes
  lesson: 60 * 5,        // 5 minutes
  user: 60 * 15,         // 15 minutes
  enrollment: 60 * 10,   // 10 minutes
  analytics: 60 * 30,    // 30 minutes
  search: 60 * 5,        // 5 minutes
  forum: 60 * 3,         // 3 minutes
  version: 60 * 60,      // 1 hour
  categories: 60 * 60,   // 1 hour
  settings: 60 * 60 * 2  // 2 hours
};

// Interface for cache options
interface CacheOptions {
  ttl?: number;          // Time-to-live in seconds
  tags?: string[];       // Cache tags for selective invalidation
  revalidate?: boolean;  // Whether to revalidate on read
  staleWhileRevalidate?: boolean; // Use stale data while fetching fresh data
  bypassCache?: boolean; // Bypass cache for this request
}

/**
 * Generate a cache key for a resource
 * 
 * @param type The type of resource being cached
 * @param id The ID of the resource (optional)
 * @param params Additional parameters to include in the cache key (optional)
 * @returns A unique cache key string
 */
export function generateCacheKey(type: CacheType, id?: string, params?: Record<string, any>): string {
  let key = `skymirror:${type}`;
  
  if (id) {
    key += `:${id}`;
  }
  
  if (params && Object.keys(params).length > 0) {
    // Sort keys to ensure consistent cache keys regardless of parameter order
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);
    
    // Append parameters to the cache key
    key += `:${JSON.stringify(sortedParams)}`;
  }
  
  return key;
}

/**
 * Cache middleware for API routes
 * 
 * @param handler The API route handler function
 * @param type The type of resource being cached
 * @param options Caching options
 * @returns A wrapped handler function with caching behavior
 */
export function withCache(
  handler: (req: NextRequest, context: any) => Promise<Response>,
  type: CacheType,
  options?: CacheOptions
) {
  return async (req: NextRequest, context: any) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return handler(req, context);
    }
    
    // Extract cache options
    const ttl = options?.ttl ?? DEFAULT_TTL[type];
    const bypassCache = options?.bypassCache ?? req.headers.get('x-bypass-cache') === 'true';
    
    // Generate a cache key based on the request
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    let resourceId = context.params?.courseId || 
                    context.params?.moduleId || 
                    context.params?.lessonId ||
                    context.params?.userId;
    
    const cacheKey = generateCacheKey(type, resourceId, searchParams);
    
    // Bypass cache if requested
    if (bypassCache) {
      return handler(req, context);
    }
    
    try {
      // Check for cached response
      const cachedData = await kv.get(cacheKey);
      
      if (cachedData) {
        // If we have cached data, return it directly
        console.log(`[CACHE_HIT] ${cacheKey}`);
        
        // Record cache hit metrics
        recordCacheMetrics(type, 'hit');
        
        // If stale-while-revalidate is enabled, trigger a background refresh
        if (options?.staleWhileRevalidate) {
          setTimeout(async () => {
            try {
              const freshResponse = await handler(req, context);
              const freshData = await freshResponse.json();
              await kv.set(cacheKey, freshData, { ex: ttl });
              console.log(`[CACHE_REVALIDATED] ${cacheKey}`);
            } catch (error) {
              console.error(`[CACHE_REVALIDATION_ERROR] ${cacheKey}`, error);
            }
          }, 0);
        }
        
        return NextResponse.json(cachedData);
      }
      
      // If not in cache, call the handler
      console.log(`[CACHE_MISS] ${cacheKey}`);
      recordCacheMetrics(type, 'miss');
      
      const response = await handler(req, context);
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        const responseData = await response.json();
        await kv.set(cacheKey, responseData, { ex: ttl });
        return NextResponse.json(responseData);
      }
      
      return response;
    } catch (error) {
      console.error(`[CACHE_ERROR] ${cacheKey}`, error);
      // On error, fall back to the original handler
      return handler(req, context);
    }
  };
}

/**
 * Invalidate cache for a specific resource
 * 
 * @param type The type of resource to invalidate
 * @param id The ID of the specific resource (optional)
 * @param path Path to revalidate in Next.js (optional)
 */
export async function invalidateCache(type: CacheType, id?: string, path?: string): Promise<void> {
  try {
    if (id) {
      // Invalidate a specific resource
      const cacheKey = generateCacheKey(type, id);
      await kv.del(cacheKey);
      console.log(`[CACHE_INVALIDATED] ${cacheKey}`);
      
      // Also try to delete any cached lists that might contain this resource
      const listKey = generateCacheKey(type + 's'); // Pluralize (e.g., course -> courses)
      await kv.del(listKey);
      
      // Revalidate specific path if provided
      if (path) {
        revalidatePath(path);
      }
    } else {
      // Invalidate all caches of this type
      const keys = await kv.keys(`skymirror:${type}*`);
      
      if (keys.length > 0) {
        await kv.del(...keys);
        console.log(`[CACHE_INVALIDATED_ALL] ${type} (${keys.length} keys)`);
      }
      
      // Revalidate paths based on type
      if (path) {
        revalidatePath(path);
      } else {
        // Default paths based on type
        const defaultPaths: Partial<Record<CacheType, string>> = {
          course: '/courses',
          courses: '/courses',
          analytics: '/admin/analytics',
          forum: '/forums',
          categories: '/'
        };
        
        if (defaultPaths[type]) {
          revalidatePath(defaultPaths[type] as string);
        }
      }
    }
  } catch (error) {
    console.error(`[CACHE_INVALIDATION_ERROR] ${type}${id ? ':' + id : ''}`, error);
  }
}

/**
 * Warm up the cache for frequently accessed resources
 * 
 * @param type The type of resource to warm up
 * @param ids List of resource IDs to warm up
 * @param fetcher Function to fetch the resource data
 */
export async function warmCache<T>(
  type: CacheType,
  ids: string[],
  fetcher: (id: string) => Promise<T>
): Promise<void> {
  try {
    console.log(`[CACHE_WARMING] ${type} (${ids.length} items)`);
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (id) => {
        try {
          const cacheKey = generateCacheKey(type, id);
          const cachedData = await kv.get(cacheKey);
          
          if (!cachedData) {
            const data = await fetcher(id);
            await kv.set(cacheKey, data, { ex: DEFAULT_TTL[type] });
            console.log(`[CACHE_WARMED] ${cacheKey}`);
          }
        } catch (error) {
          console.error(`[CACHE_WARMING_ERROR] ${type}:${id}`, error);
        }
      }));
      
      // Small delay between batches
      if (batch.length === batchSize && i + batchSize < ids.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`[CACHE_WARMING_COMPLETE] ${type}`);
  } catch (error) {
    console.error(`[CACHE_WARMING_ERROR] ${type}`, error);
  }
}

/**
 * Record cache metrics for monitoring and optimization
 * 
 * @param type The type of resource
 * @param result The cache operation result ('hit' or 'miss')
 */
function recordCacheMetrics(type: CacheType, result: 'hit' | 'miss'): void {
  // This is a placeholder for actual metrics recording
  // In a production environment, this would send data to a monitoring service
  
  // For now, we're just logging to the console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CACHE_METRICS] ${type} ${result}`);
  }
  
  // In the future, we could implement:
  // - Cache hit rate tracking
  // - Resource access frequency analysis
  // - Automatic TTL adjustments based on access patterns
  // - Alert on unusual cache behavior
}

/**
 * Create a cached version of a function
 * 
 * @param fn The function to cache
 * @param type The type of resource being cached
 * @param options Caching options
 * @returns A cached version of the function
 */
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  type: CacheType,
  options?: CacheOptions
): (...args: T) => Promise<R> {
  const ttl = options?.ttl ?? DEFAULT_TTL[type];
  const tags = options?.tags ?? [type];
  
  return unstable_cache(fn, [type, ...tags], {
    revalidate: ttl
  });
}

/**
 * Middleware for rate limiting and caching
 * Used to protect heavy operations and prevent abuse
 */
export async function withRateLimitAndCache(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
  options: {
    type: CacheType,
    limit?: number,
    timeframe?: number,
    bypassCache?: boolean
  }
): Promise<Response> {
  // Apply rate limiting first
  const limiter = rateLimit({
    limit: options.limit ?? 60,
    timeframe: options.timeframe ?? 60, // 60 requests per 60 seconds by default
  });
  
  const limiterResponse = await limiter.check(req);
  
  // If rate limit is exceeded, return the response from the limiter
  if (limiterResponse) {
    return limiterResponse;
  }
  
  // Skip cache for non-GET requests
  if (req.method !== 'GET' || options.bypassCache) {
    return handler(req);
  }
  
  // For GET requests, apply caching
  const url = new URL(req.url);
  const resourceId = url.pathname.split('/').pop();
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  const cacheKey = generateCacheKey(options.type, resourceId, searchParams);
  
  try {
    const cachedData = await kv.get(cacheKey);
    
    if (cachedData) {
      recordCacheMetrics(options.type, 'hit');
      return NextResponse.json(cachedData);
    }
    
    recordCacheMetrics(options.type, 'miss');
    const response = await handler(req);
    
    if (response.status >= 200 && response.status < 300) {
      const data = await response.clone().json();
      await kv.set(cacheKey, data, { ex: DEFAULT_TTL[options.type] });
    }
    
    return response;
  } catch (error) {
    console.error(`[CACHE_ERROR] ${cacheKey}`, error);
    return handler(req);
  }
}
