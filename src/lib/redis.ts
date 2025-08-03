import { Redis } from '@upstash/redis';

// Initialize Redis client with your Upstash Redis credentials
// Replace with your actual Upstash Redis credentials
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  : null;

export default redis;
