import { randomUUID } from 'crypto';
import { redisManager } from '../redis/redisClient';
import { infraConfig } from '../config/env';

// Lua script to safely release lock only if the token matches
const SAFE_RELEASE_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

// Lua script to extend lock duration
const EXTEND_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
else
    return 0
end
`;

export interface LockHandle {
  resource: string;
  token: string;
  ttlMs: number;
  acquiredAt: number;
}

export class DistributedLock {
  // In-memory fallback locks if Redis is down
  private static memoryLocks: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Acquire a distributed lock with automatic retry and exponential jitter backoff
   */
  public static async acquire(
    resource: string,
    ttlMs: number = infraConfig.LOCK_DEFAULT_TTL_MS,
    maxRetries: number = infraConfig.LOCK_MAX_RETRIES,
    retryDelayMs: number = infraConfig.LOCK_RETRY_DELAY_MS
  ): Promise<LockHandle | null> {
    const token = randomUUID();
    const startTime = Date.now();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const acquired = await this.tryAcquire(resource, token, ttlMs);
      if (acquired) {
        return {
          resource,
          token,
          ttlMs,
          acquiredAt: Date.now(),
        };
      }

      if (attempt < maxRetries) {
        // Exponential backoff with random jitter (e.g. 50ms - 150ms)
        const jitter = Math.random() * 50;
        const delay = Math.min(retryDelayMs * Math.pow(1.1, attempt) + jitter, 1000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.warn(`[DistributedLock] Failed to acquire lock on resource '${resource}' after ${maxRetries} attempts.`);
    return null;
  }

  private static async tryAcquire(resource: string, token: string, ttlMs: number): Promise<boolean> {
    const client = redisManager.getClient();
    if (redisManager.isHealthy() && client) {
      try {
        const result = await client.set(resource, token, 'PX', ttlMs, 'NX');
        return result === 'OK';
      } catch (err) {
        // Fall back to in-memory
      }
    }

    // In-memory fallback
    const now = Date.now();
    const existing = this.memoryLocks.get(resource);
    if (existing && existing.expiresAt > now) {
      return false;
    }
    this.memoryLocks.set(resource, { token, expiresAt: now + ttlMs });
    return true;
  }

  /**
   * Safely release lock ensuring only the holder can release it
   */
  public static async release(lock: LockHandle): Promise<boolean> {
    const client = redisManager.getClient();
    if (redisManager.isHealthy() && client) {
      try {
        const result = await client.eval(SAFE_RELEASE_LUA, 1, lock.resource, lock.token);
        return result === 1;
      } catch (err) {
        // Fall back to in-memory
      }
    }

    const existing = this.memoryLocks.get(lock.resource);
    if (existing && existing.token === lock.token) {
      this.memoryLocks.delete(lock.resource);
      return true;
    }
    return false;
  }

  /**
   * Execute an asynchronous task inside a distributed lock with guaranteed safe release
   */
  public static async withLock<T>(
    resource: string,
    ttlMs: number = infraConfig.LOCK_DEFAULT_TTL_MS,
    task: (lock: LockHandle) => Promise<T>,
    maxRetries: number = infraConfig.LOCK_MAX_RETRIES
  ): Promise<T> {
    const lock = await this.acquire(resource, ttlMs, maxRetries);
    if (!lock) {
      throw new Error(`Resource '${resource}' is currently locked by another concurrent process. Please retry.`);
    }

    try {
      return await task(lock);
    } finally {
      await this.release(lock);
    }
  }
}
