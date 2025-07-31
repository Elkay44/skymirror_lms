import { Redis } from '@upstash/redis';

// Initialize Redis client with your Upstash Redis credentials
// Replace with your actual Upstash Redis credentials
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

if (!redis) {
  throw new Error('Redis client initialization failed');
}

export default redis;
