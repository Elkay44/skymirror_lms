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
import { rateLimit } from '@/lib/rate-limit';

// In-memory cache for development
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Simple in-memory cache implementation
const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (item.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.value as T;
  },
  
  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    });
  },
  
  async del(key: string): Promise<void> {
    memoryCache.delete(key);
  },
  
  async keys(prefix: string): Promise<string[]> {
    const allKeys: string[] = [];
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        allKeys.push(key);
      }
    }
    return allKeys;
  }
};

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
      // Check cache first if not bypassing
      if (!bypassCache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          recordCacheMetrics(type, 'hit');
          console.log(`[CACHE_HIT] ${cacheKey}`);
          
          // If stale-while-revalidate is enabled, trigger a background refresh
          if (options?.staleWhileRevalidate) {
            // Don't await this, let it run in the background
            handler(req, context).then(async (response) => {
              if (response.status >= 200 && response.status < 300) {
                const responseData = await response.json();
                await cache.set(cacheKey, responseData, ttl);
              }
            }).catch(console.error);
          }
          
          return NextResponse.json(cached);
        }
      }
      
      recordCacheMetrics(type, 'miss');
      
      // If no cache hit, proceed with the handler
      const response = await handler(req, context);
      
      // Only cache successful responses
      if (response.status >= 200 && response.status < 300) {
        const responseData = await response.json();
        await cache.set(cacheKey, responseData, ttl);
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
      await cache.del(cacheKey);
      console.log(`[CACHE_INVALIDATED] ${cacheKey}`);
      
      // Also try to delete any cached lists that might contain this resource
      const listKey = generateCacheKey((type + 's') as CacheType); // Pluralize (e.g., course -> courses)
      // Delete all keys with the list prefix
      const keys = await cache.keys(`${listKey}:`);
      await Promise.all(keys.map(key => cache.del(key)));
      
      // Revalidate specific path if provided
      if (path) {
        revalidatePath(path);
      }
    } else {
      // Invalidate all caches of this type
      const keys = await cache.keys(`skymirror:${type}*`);
      
      if (keys.length > 0) {
        await Promise.all(keys.map(key => cache.del(key)));
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
  if (ids.length === 0) return;
  
  console.log(`[CACHE_WARMING] Warming cache for ${type} with ${ids.length} items`);
  
  // Process in batches to avoid overwhelming the system
  const BATCH_SIZE = 10;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (id) => {
      const cacheKey = generateCacheKey(type, id);
      
      try {
        // Check if already in cache
        const cachedData = await cache.get(cacheKey);
        
        if (!cachedData) {
          // If not in cache, fetch and cache
          const data = await fetcher(id);
          await cache.set(cacheKey, data, DEFAULT_TTL[type]);
          console.log(`[CACHE_WARMED] ${cacheKey}`);
        }
      } catch (error) {
        console.error(`[CACHE_WARM_ERROR] Failed to warm cache for ${cacheKey}`, error);
      }
    }));
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
  // Generate a unique cache key for this request
  const cacheKey = generateCacheKey(
    options.type,
    undefined,
    { url: req.nextUrl.pathname, ...Object.fromEntries(req.nextUrl.searchParams) }
  );
  
  // Check cache first if not bypassing
  if (!options.bypassCache) {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(`[CACHE_HIT] ${cacheKey}`);
      return NextResponse.json(cachedData);
    }
  }
  
  // Apply rate limiting
  const rateLimiter = rateLimit({
    limit: options.limit || 10,
    timeframe: options.timeframe || 60,
    identifier: `rate-limit:${options.type}`
  });
  
  const rateLimitResponse = await rateLimiter.check(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // If we got here, process the request
  const response = await handler(req);
  
  // Cache successful responses
  if (response.status >= 200 && response.status < 300) {
    const data = await response.json();
    await cache.set(cacheKey, data, DEFAULT_TTL[options.type]);
    return NextResponse.json(data);
  }
  
  return response;
}
