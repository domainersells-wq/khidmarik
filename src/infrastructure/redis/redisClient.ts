import Redis, { RedisOptions } from 'ioredis';
import { infraConfig } from '../config/env';

export class RedisManager {
  private static instance: RedisManager | null = null;
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private memoryFallback: Map<string, { value: string; expiry?: number }> = new Map();

  private constructor() {
    this.initClient();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private initClient(): void {
    const options: RedisOptions = {
      connectTimeout: infraConfig.REDIS_CONNECT_TIMEOUT_MS,
      commandTimeout: infraConfig.REDIS_COMMAND_TIMEOUT_MS,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > infraConfig.REDIS_MAX_RETRIES) {
          console.warn(`[RedisManager] Max reconnect attempts (${infraConfig.REDIS_MAX_RETRIES}) reached.`);
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    };

    if (infraConfig.REDIS_PASSWORD) {
      options.password = infraConfig.REDIS_PASSWORD;
    }

    try {
      this.client = new Redis(infraConfig.REDIS_URL, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ [RedisManager] Connected to Redis cluster/instance.');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        // Log cleanly without uncaught exception
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[RedisManager] Redis connection warning (operating with resilient fallback):', err.message);
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      // Connect asynchronously
      this.client.connect().catch((err) => {
        this.isConnected = false;
      });
    } catch (err: any) {
      console.warn('[RedisManager] Failed to instantiate Redis client:', err.message);
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public isHealthy(): boolean {
    return this.isConnected && this.client !== null && this.client.status === 'ready';
  }

  public async ping(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    if (!this.client || !this.isConnected) {
      return { healthy: false, latencyMs: 0 };
    }
    try {
      const response = await this.client.ping();
      const latencyMs = Date.now() - start;
      return { healthy: response === 'PONG', latencyMs };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  // Resilient Redis Operations with In-Memory fallback for resilient execution

  public async get(key: string): Promise<string | null> {
    if (this.isHealthy() && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        // Fallback to memory
      }
    }
    const item = this.memoryFallback.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.memoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  public async set(key: string, value: string, mode?: 'EX' | 'PX', duration?: number): Promise<'OK' | null> {
    if (this.isHealthy() && this.client) {
      try {
        if (mode && duration) {
          return await (this.client as any).set(key, value, mode, duration);
        }
        return await this.client.set(key, value);
      } catch (err) {
        // Fallback to memory
      }
    }
    const expiry = duration
      ? Date.now() + (mode === 'EX' ? duration * 1000 : duration)
      : undefined;
    this.memoryFallback.set(key, { value, expiry });
    return 'OK';
  }

  public async setnx(key: string, value: string, ttlMs: number): Promise<boolean> {
    if (this.isHealthy() && this.client) {
      try {
        const res = await this.client.set(key, value, 'PX', ttlMs, 'NX');
        return res === 'OK';
      } catch (err) {
        // Fallback to memory
      }
    }
    const existing = this.memoryFallback.get(key);
    if (existing && (!existing.expiry || Date.now() <= existing.expiry)) {
      return false;
    }
    this.memoryFallback.set(key, { value, expiry: Date.now() + ttlMs });
    return true;
  }

  public async del(key: string): Promise<number> {
    if (this.isHealthy() && this.client) {
      try {
        return await this.client.del(key);
      } catch (err) {
        // Fallback to memory
      }
    }
    const existed = this.memoryFallback.delete(key);
    return existed ? 1 : 0;
  }

  public async eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<any> {
    if (this.isHealthy() && this.client) {
      return await this.client.eval(script, numkeys, ...args);
    }
    return null;
  }

  public async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        this.client.disconnect();
      }
      this.isConnected = false;
      this.client = null;
      console.log('🛑 [RedisManager] Redis connections closed gracefully.');
    }
  }
}

export const redisManager = RedisManager.getInstance();
