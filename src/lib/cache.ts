import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

// Initialize Redis client if environment variables are present
let redis: Redis | null = null;

if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  });
}

// Default TTL values in seconds
const DEFAULT_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Cache types for different resources
type CacheType =
  | 'course'
  | 'courses'
  | 'module'
  | 'lesson'
  | 'user'
  | 'enrollment'
  | 'discussion'
  | 'comment'
  | 'analytics'
  | 'search';

/**
 * Creates a cache key based on the resource type and parameters
 */
export function createCacheKey(
  type: CacheType,
  identifier: string | Record<string, any>
): string {
  const idString =
    typeof identifier === 'string'
      ? identifier
      : JSON.stringify(sortObjectKeys(identifier));
  
  // Create a hash of the identifier to keep cache keys short
  const hash = createHash('md5').update(idString).digest('hex').substring(0, 8);
  
  return `lms:${type}:${hash}`;
}

/**
 * Sort object keys for consistent cache key generation
 */
function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, any>, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

/**
 * Get data from cache
 */
export async function getFromCache<T>(
  type: CacheType,
  identifier: string | Record<string, any>
): Promise<T | null> {
  if (!redis) return null;

  try {
    const key = createCacheKey(type, identifier);
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    console.error(`Cache get error for ${type}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCache(
  type: CacheType,
  identifier: string | Record<string, any>,
  data: any,
  ttl: number = DEFAULT_TTL.MEDIUM
): Promise<boolean> {
  if (!redis) return false;

  try {
    const key = createCacheKey(type, identifier);
    await redis.set(key, data, { ex: ttl });
    return true;
  } catch (error) {
    console.error(`Cache set error for ${type}:`, error);
    return false;
  }
}

/**
 * Remove item from cache
 */
export async function invalidateCache(
  type: CacheType,
  identifier: string | Record<string, any>
): Promise<boolean> {
  if (!redis) return false;

  try {
    const key = createCacheKey(type, identifier);
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Cache invalidation error for ${type}:`, error);
    return false;
  }
}

/**
 * Invalidate all cache entries of a specific type
 */
export async function invalidateCacheByType(type: CacheType): Promise<boolean> {
  if (!redis) return false;

  try {
    const pattern = `lms:${type}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return true;
  } catch (error) {
    console.error(`Cache type invalidation error for ${type}:`, error);
    return false;
  }
}

/**
 * Get or set cache - utility function that combines get and set
 */
export async function getOrSetCache<T>(
  type: CacheType,
  identifier: string | Record<string, any>,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.MEDIUM
): Promise<T> {
  if (!redis) return fetchFn();

  try {
    const cachedData = await getFromCache<T>(type, identifier);
    
    if (cachedData !== null) {
      return cachedData;
    }
    
    const freshData = await fetchFn();
    await setCache(type, identifier, freshData, ttl);
    return freshData;
  } catch (error) {
    console.error(`Cache get-or-set error for ${type}:`, error);
    return fetchFn();
  }
}

/**
 * Clear all LMS-related cache
 */
export async function clearAllCache(): Promise<boolean> {
  if (!redis) return false;

  try {
    const keys = await redis.keys('lms:*');
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return true;
  } catch (error) {
    console.error('Clear all cache error:', error);
    return false;
  }
}

// Default expiration times based on resource type
export function getDefaultTTL(type: CacheType): number {
  switch (type) {
    case 'course':
      return DEFAULT_TTL.MEDIUM;
    case 'courses':
      return DEFAULT_TTL.SHORT;
    case 'module':
      return DEFAULT_TTL.MEDIUM;
    case 'lesson':
      return DEFAULT_TTL.MEDIUM;
    case 'user':
      return DEFAULT_TTL.SHORT;
    case 'enrollment':
      return DEFAULT_TTL.SHORT;
    case 'discussion':
      return DEFAULT_TTL.SHORT;
    case 'comment':
      return DEFAULT_TTL.SHORT;
    case 'analytics':
      return DEFAULT_TTL.SHORT;
    default:
      return DEFAULT_TTL.MEDIUM;
  }
}

export const CACHE_TTL = DEFAULT_TTL;

// Export a combined cache object for named imports
export const cache = {
  get: getFromCache,
  set: setCache,
  invalidate: invalidateCache,
  invalidateByType: invalidateCacheByType,
  getOrSet: getOrSetCache,
  createKey: createCacheKey,
};
