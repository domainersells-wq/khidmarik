import { Pool, PoolClient, QueryResult } from 'pg';
import { infraConfig } from '../config/env';

export interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

export class DatabasePoolManager {
  private static instance: DatabasePoolManager | null = null;
  private pool: Pool | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.initPool();
  }

  public static getInstance(): DatabasePoolManager {
    if (!DatabasePoolManager.instance) {
      DatabasePoolManager.instance = new DatabasePoolManager();
    }
    return DatabasePoolManager.instance;
  }

  private initPool(): void {
    const connectionString = infraConfig.DATABASE_URL || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!connectionString) {
      // In development / serverless fallback without direct PG connection string
      this.isConfigured = false;
      return;
    }

    try {
      this.pool = new Pool({
        connectionString,
        min: infraConfig.DB_POOL_MIN,
        max: infraConfig.DB_POOL_MAX,
        idleTimeoutMillis: infraConfig.DB_IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: infraConfig.DB_CONNECTION_TIMEOUT_MS,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      });

      this.pool.on('error', (err) => {
        console.error('❌ [DatabasePool] Unexpected idle client error:', err.message);
      });

      this.isConfigured = true;
      console.log('✅ [DatabasePool] PostgreSQL shared connection pool initialized.');
    } catch (err: any) {
      console.warn('[DatabasePool] Failed to initialize pg.Pool:', err.message);
      this.isConfigured = false;
    }
  }

  public isAvailable(): boolean {
    return this.isConfigured && this.pool !== null;
  }

  public getPool(): Pool | null {
    return this.pool;
  }

  public getStats(): PoolStats {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  public async query<R extends import('pg').QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<R>> {
    if (!this.pool) {
      throw new Error('[DatabasePool] Database pool is not configured. Check DATABASE_URL.');
    }

    const start = Date.now();
    try {
      const res = await this.pool.query<R>(text, params);
      const duration = Date.now() - start;

      if (duration > infraConfig.DB_SLOW_QUERY_THRESHOLD_MS) {
        console.warn(`⚠️ [DatabasePool Slow Query] (${duration}ms):`, text.slice(0, 150));
      }

      return res;
    } catch (error: any) {
      console.error('[DatabasePool Query Error]', error.message, 'Query:', text.slice(0, 100));
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('[DatabasePool] Database pool is not configured.');
    }
    return await this.pool.connect();
  }

  public async ping(): Promise<{ healthy: boolean; latencyMs: number }> {
    if (!this.pool) {
      return { healthy: false, latencyMs: 0 };
    }
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConfigured = false;
      console.log('🛑 [DatabasePool] PostgreSQL pool drained and closed.');
    }
  }
}

export const dbPool = DatabasePoolManager.getInstance();
