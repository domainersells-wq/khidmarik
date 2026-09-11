import { dbPool } from '../database/dbPool';
import { redisManager } from '../redis/redisClient';
import { queueManager } from '../queues/queueManager';

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number; poolStats: any };
    redis: { status: 'up' | 'down'; latencyMs: number };
    queues: { status: 'up' | 'down'; metrics?: any };
  };
}

export class HealthService {
  public static async getLiveness(): Promise<{ status: string; uptime: number }> {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }

  public static async getReadiness(): Promise<HealthReport> {
    const [dbCheck, redisCheck, queueMetrics] = await Promise.all([
      dbPool.ping(),
      redisManager.ping(),
      queueManager.getQueueMetrics(),
    ]);

    const isDbUp = !dbPool.isAvailable() || dbCheck.healthy;
    const isRedisUp = redisManager.isHealthy();

    const isHealthy = isDbUp && isRedisUp;
    const isDegraded = isDbUp && !isRedisUp;

    return {
      status: isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database: {
          status: dbCheck.healthy ? 'up' : 'down',
          latencyMs: dbCheck.latencyMs,
          poolStats: dbPool.getStats(),
        },
        redis: {
          status: redisCheck.healthy ? 'up' : 'down',
          latencyMs: redisCheck.latencyMs,
        },
        queues: {
          status: 'up',
          metrics: queueMetrics,
        },
      },
    };
  }
}
