import { createHash } from 'crypto';
import { redisManager } from '../redis/redisClient';
import { RedisKeys } from '../redis/redisNamespace';
import { infraConfig } from '../config/env';

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRecord {
  key: string;
  fingerprint: string;
  status: IdempotencyStatus;
  responseStatus?: number;
  responseBody?: any;
  createdAt: number;
  completedAt?: number;
}

export class IdempotencyService {
  // In-memory fallback
  private static memoryStore: Map<string, IdempotencyRecord> = new Map();

  /**
   * Generate a canonical SHA-256 fingerprint from the request parameters
   */
  public static generateFingerprint(method: string, path: string, body: any): string {
    const serializedBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = `${method.toUpperCase()}:${path}:${serializedBody}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Check or acquire idempotency lock
   */
  public static async getRecord(key: string): Promise<IdempotencyRecord | null> {
    const redisKey = RedisKeys.idempotency(key);
    const raw = await redisManager.get(redisKey);
    if (raw) {
      try {
        return JSON.parse(raw) as IdempotencyRecord;
      } catch (e) {
        // Corrupted, ignore
      }
    }

    const mem = this.memoryStore.get(key);
    return mem || null;
  }

  /**
   * Start processing a new idempotent request
   */
  public static async startProcessing(key: string, fingerprint: string): Promise<boolean> {
    const record: IdempotencyRecord = {
      key,
      fingerprint,
      status: 'PROCESSING',
      createdAt: Date.now(),
    };

    const redisKey = RedisKeys.idempotency(key);
    const acquired = await redisManager.setnx(
      redisKey,
      JSON.stringify(record),
      infraConfig.IDEMPOTENCY_TTL_SECS * 1000
    );

    if (!acquired) {
      return false;
    }

    this.memoryStore.set(key, record);
    return true;
  }

  /**
   * Save the completed response in the idempotency record
   */
  public static async complete(
    key: string,
    fingerprint: string,
    responseStatus: number,
    responseBody: any
  ): Promise<void> {
    const record: IdempotencyRecord = {
      key,
      fingerprint,
      status: 'COMPLETED',
      responseStatus,
      responseBody,
      createdAt: Date.now(),
      completedAt: Date.now(),
    };

    const redisKey = RedisKeys.idempotency(key);
    await redisManager.set(
      redisKey,
      JSON.stringify(record),
      'EX',
      infraConfig.IDEMPOTENCY_TTL_SECS
    );

    this.memoryStore.set(key, record);
  }

  /**
   * Mark as failed or release lock on failure so the user can retry
   */
  public static async fail(key: string): Promise<void> {
    const redisKey = RedisKeys.idempotency(key);
    await redisManager.del(redisKey);
    this.memoryStore.delete(key);
  }
}
