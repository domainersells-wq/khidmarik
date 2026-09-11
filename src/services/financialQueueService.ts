import { TopUpRequest } from '@/types/financials';
import { financialService } from '@/services/financialService';

export interface FinancialQueueTask {
  id: string;
  type: 'VERIFY_PAYMENT' | 'PROCESS_WEBHOOK' | 'RECONCILE_TRANSACTION' | 'NOTIFY_USER';
  payload: any;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRY';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
  idempotencyKey: string;
}

class FinancialQueueService {
  private QUEUE_KEY = 'khidmatik_fin_tasks_queue';
  private inFlightLocks: Set<string> = new Set();

  private getQueue(): FinancialQueueTask[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.QUEUE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Queue parse error', e);
    }
    return [];
  }

  private saveQueue(queue: FinancialQueueTask[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue.slice(0, 500))); // Keep last 500 tasks
    } catch (e) {
      console.error('Queue save error', e);
    }
  }

  /**
   * Enqueue a new background financial task with idempotency key
   */
  public enqueue(task: Omit<FinancialQueueTask, 'id' | 'status' | 'attempts' | 'createdAt'>): FinancialQueueTask {
    const queue = this.getQueue();
    
    // Check if idempotent task already exists
    const existing = queue.find(t => t.idempotencyKey === task.idempotencyKey && (t.status === 'QUEUED' || t.status === 'COMPLETED'));
    if (existing) {
      return existing;
    }

    const newTask: FinancialQueueTask = {
      ...task,
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'QUEUED',
      attempts: 0,
      maxAttempts: task.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    queue.push(newTask);
    this.saveQueue(queue);
    return newTask;
  }

  /**
   * Acquire distributed-style lock for a wallet / request to prevent race conditions
   */
  public acquireLock(resourceId: string): boolean {
    if (this.inFlightLocks.has(resourceId)) {
      return false; // Lock contention
    }
    this.inFlightLocks.add(resourceId);
    return true;
  }

  /**
   * Release lock
   */
  public releaseLock(resourceId: string): void {
    this.inFlightLocks.delete(resourceId);
  }

  /**
   * Process queued verification tasks (Background Worker simulation)
   */
  public processPendingTasks(): { processed: number; succeeded: number; failed: number } {
    const queue = this.getQueue();
    const pending = queue.filter(t => t.status === 'QUEUED' || t.status === 'RETRY');
    let succeeded = 0;
    let failed = 0;

    pending.forEach(task => {
      if (!this.acquireLock(task.idempotencyKey)) {
        return; // Locked by another worker
      }

      task.status = 'PROCESSING';
      task.attempts += 1;

      try {
        if (task.type === 'VERIFY_PAYMENT') {
          const reqId = task.payload.topUpRequestId;
          const req = financialService.getTopUpRequestById(reqId);
          if (req && req.status === 'UNDER_REVIEW') {
            financialService.approveTopUpRequest(reqId, 'Queue Worker Engine', 'Verified via background worker matching');
            task.status = 'COMPLETED';
            task.processedAt = new Date().toISOString();
            succeeded++;
          } else {
            task.status = 'COMPLETED';
            succeeded++;
          }
        }
      } catch (err: any) {
        task.error = err.message;
        if (task.attempts < task.maxAttempts) {
          task.status = 'RETRY';
        } else {
          task.status = 'FAILED';
          failed++;
        }
      } finally {
        this.releaseLock(task.idempotencyKey);
      }
    });

    this.saveQueue(queue);
    return { processed: pending.length, succeeded, failed };
  }

  /**
   * Queue health metrics for admin monitor
   */
  public getQueueMetrics(): { queueDepth: number; failedCount: number; completedCount: number } {
    const queue = this.getQueue();
    return {
      queueDepth: queue.filter(t => t.status === 'QUEUED' || t.status === 'PROCESSING').length,
      failedCount: queue.filter(t => t.status === 'FAILED').length,
      completedCount: queue.filter(t => t.status === 'COMPLETED').length,
    };
  }
}

export const financialQueueService = new FinancialQueueService();
