import { dbPool } from '../database/dbPool';
import { redisManager } from '../redis/redisClient';
import { queueManager } from '../queues/queueManager';
import { workerManager } from '../workers/workerManager';
import { OutboxRelay } from '../outbox/outboxRelay';

export class ShutdownRegistry {
  private static isRegistered = false;

  public static register(): void {
    if (this.isRegistered || typeof process === 'undefined') return;
    this.isRegistered = true;

    const handleShutdown = async (signal: string) => {
      console.log(`\n⏳ [ShutdownRegistry] Received ${signal}. Starting graceful shutdown...`);

      try {
        OutboxRelay.stop();
        await workerManager.close();
        await queueManager.close();
        await redisManager.close();
        await dbPool.close();
        console.log('✅ [ShutdownRegistry] All infrastructure resources closed cleanly.');
      } catch (err: any) {
        console.error('❌ [ShutdownRegistry] Error during graceful shutdown:', err.message);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  }
}
