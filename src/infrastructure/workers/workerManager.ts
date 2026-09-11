import { Worker, Job } from 'bullmq';
import { infraConfig } from '../config/env';
import { redisManager } from '../redis/redisClient';
import { NotificationJobData, OrderJobData, FinancialJobData } from '../queues/queueManager';

export class WorkerManager {
  private static instance: WorkerManager | null = null;
  private workers: Worker[] = [];
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public start(): void {
    if (this.isRunning) return;

    const redisClient = redisManager.getClient();
    if (!redisClient) {
      console.log('ℹ️ [WorkerManager] Redis client unavailable; background jobs will process inline.');
      return;
    }

    try {
      const workerOpts = {
        connection: redisClient as any,
        concurrency: infraConfig.WORKER_CONCURRENCY,
        prefix: `{${infraConfig.REDIS_KEY_PREFIX}:queue}`,
      };

      // 1. Notification Worker
      const notificationWorker = new Worker<NotificationJobData>(
        'notifications',
        async (job: Job<NotificationJobData>) => {
          const { type, recipientId, title, body } = job.data;
          // Process notification asynchronously
          console.log(`📨 [Notification Worker] Delivered ${type} to user ${recipientId}: "${title}"`);
        },
        workerOpts
      );

      // 2. Order Worker
      const orderWorker = new Worker<OrderJobData>(
        'orders',
        async (job: Job<OrderJobData>) => {
          const { orderId, action } = job.data;
          console.log(`📦 [Order Worker] Executed ${action} for order ${orderId}`);
        },
        workerOpts
      );

      // 3. Financial Worker
      const financialWorker = new Worker<FinancialJobData>(
        'financials',
        async (job: Job<FinancialJobData>) => {
          const { action, entityId } = job.data;
          console.log(`💰 [Financial Worker] Executed ${action} for entity ${entityId}`);
        },
        workerOpts
      );

      this.workers.push(notificationWorker, orderWorker, financialWorker);

      this.workers.forEach((worker) => {
        worker.on('failed', (job, err) => {
          console.error(`❌ [Worker Error] Job ${job?.id} in queue '${worker.name}' failed:`, err.message);
        });
      });

      this.isRunning = true;
      console.log('🚀 [WorkerManager] Dedicated background workers initialized and active.');
    } catch (err: any) {
      console.warn('[WorkerManager] Failed to start BullMQ workers:', err.message);
    }
  }

  public async close(): Promise<void> {
    for (const worker of this.workers) {
      await worker.close();
    }
    this.workers = [];
    this.isRunning = false;
    console.log('🛑 [WorkerManager] Background workers closed gracefully.');
  }
}

export const workerManager = WorkerManager.getInstance();
