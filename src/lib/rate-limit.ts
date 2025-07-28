/**
 * Rate limiting implementation for Skymirror LMS API endpoints
 * Prevents abuse and ensures fair usage of resources
 */

import { NextRequest, NextResponse } from 'next/server';

type RateLimitOptions = {
  limit: number;       // Number of requests allowed
  timeframe: number;   // Time window in seconds
  identifier?: string; // Custom identifier for the rate limit
};

type RateLimitData = {
  count: number;        // Current count of requests
  lastReset: number;    // Timestamp of last reset
};

// In-memory store for rate limiting data (would be Redis in production)
const rateLimits = new Map<string, RateLimitData>();

/**
 * Create a rate limiter instance
 * 
 * @param options Rate limit configuration options
 * @returns A rate limiter object with a check method
 */
export function rateLimit(options: RateLimitOptions) {
  const { limit, timeframe } = options;
  
  return {
    /**
     * Check if the request exceeds the rate limit
     * 
     * @param req NextRequest object
     * @returns Response object if limit exceeded, null otherwise
     */
    async check(req: NextRequest): Promise<Response | null> {
      // Get identifier from request (IP address, user ID, or custom)
      // Note: req.ip is not available in Next.js 13+ App Router by default
      // In a production environment, you would use a proper IP detection method
      // For development, we'll use a static identifier
      const ip = '127.0.0.1';
      const identifier = options.identifier ? 
        `${options.identifier}:${ip}` : 
        `rate-limit:${req.nextUrl.pathname}:${ip}`;
      
      // Get current timestamp
      const now = Date.now();
      
      // Get existing rate limit data or create new
      let data = rateLimits.get(identifier);
      
      if (!data) {
        data = {
          count: 0,
          lastReset: now
        };
      }
      
      // Check if timeframe has passed and reset if needed
      const timeframeMs = timeframe * 1000;
      if (now - data.lastReset > timeframeMs) {
        data = {
          count: 0,
          lastReset: now
        };
      }
      
      // Increment request count
      data.count++;
      
      // Store updated data
      rateLimits.set(identifier, data);
      
      // If over limit, return 429 response
      if (data.count > limit) {
        // Calculate remaining time until reset
        const resetAt = new Date(data.lastReset + timeframeMs);
        const secondsUntilReset = Math.ceil((resetAt.getTime() - now) / 1000);
        
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests, please try again in ${secondsUntilReset} seconds`,
            limit,
            remaining: 0,
            resetAt: resetAt.toISOString()
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(resetAt.getTime() / 1000).toString(),
              'Retry-After': secondsUntilReset.toString()
            }
          }
        );
      }
      
      // Not rate limited
      return null;
    }
  };
}
