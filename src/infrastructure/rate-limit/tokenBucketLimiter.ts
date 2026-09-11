import { redisManager } from '../redis/redisClient';
import { RedisKeys } from '../redis/redisNamespace';

// Lua script for atomic Token Bucket algorithm
const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local ttl = math.ceil(capacity / refill_rate) * 2

local bucket = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(bucket[1])
local last_updated = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  last_updated = now
else
  local delta = math.max(0, now - last_updated)
  tokens = math.min(capacity, tokens + delta * refill_rate)
  last_updated = now
end

if tokens >= requested then
  tokens = tokens - requested
  redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
  redis.call('EXPIRE', key, ttl)
  local reset_time = math.ceil((capacity - tokens) / refill_rate)
  return {1, math.floor(tokens), reset_time, 0}
else
  redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
  redis.call('EXPIRE', key, ttl)
  local retry_after = math.ceil((requested - tokens) / refill_rate)
  return {0, math.floor(tokens), retry_after, retry_after}
end
`;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  retryAfterSeconds: number;
}

export interface RateLimitConfig {
  capacity: number; // Max burst
  refillRatePerSec: number; // Refill tokens per second
}

export class TokenBucketLimiter {
  // In-memory fallback buckets if Redis is down
  private static memoryBuckets: Map<string, { tokens: number; lastUpdated: number }> = new Map();

  public static async consume(
    endpointGroup: string,
    identifier: string,
    config: RateLimitConfig,
    cost: number = 1
  ): Promise<RateLimitResult> {
    const key = RedisKeys.rateLimit(endpointGroup, identifier);
    const now = Math.floor(Date.now() / 1000);

    const client = redisManager.getClient();
    if (redisManager.isHealthy() && client) {
      try {
        const result = (await client.eval(
          TOKEN_BUCKET_LUA,
          1,
          key,
          config.capacity,
          config.refillRatePerSec,
          cost,
          now
        )) as [number, number, number, number];

        return {
          allowed: result[0] === 1,
          limit: config.capacity,
          remaining: result[1],
          resetInSeconds: result[2],
          retryAfterSeconds: result[3],
        };
      } catch (err) {
        // Fall back to in-memory calculation
      }
    }

    // In-memory token bucket fallback
    let bucket = this.memoryBuckets.get(key);
    if (!bucket) {
      bucket = { tokens: config.capacity, lastUpdated: now };
    } else {
      const delta = Math.max(0, now - bucket.lastUpdated);
      bucket.tokens = Math.min(config.capacity, bucket.tokens + delta * config.refillRatePerSec);
      bucket.lastUpdated = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.memoryBuckets.set(key, bucket);
      return {
        allowed: true,
        limit: config.capacity,
        remaining: Math.floor(bucket.tokens),
        resetInSeconds: Math.ceil((config.capacity - bucket.tokens) / config.refillRatePerSec),
        retryAfterSeconds: 0,
      };
    } else {
      const retryAfter = Math.ceil((cost - bucket.tokens) / config.refillRatePerSec);
      this.memoryBuckets.set(key, bucket);
      return {
        allowed: false,
        limit: config.capacity,
        remaining: Math.floor(bucket.tokens),
        resetInSeconds: retryAfter,
        retryAfterSeconds: retryAfter,
      };
    }
  }
}
