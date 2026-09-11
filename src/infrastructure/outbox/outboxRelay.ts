import { OutboxService } from './outboxService';
import { eventBus } from '../events/eventBus';
import { DomainEvent, DomainEventType } from '../events/domainEvents';
import { infraConfig } from '../config/env';

export class OutboxRelay {
  private static isRunning: boolean = false;
  private static timer: NodeJS.Timeout | null = null;

  public static start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.timer = setInterval(async () => {
      await this.processBatch();
    }, infraConfig.OUTBOX_POLL_INTERVAL_MS);

    console.log('🔄 [OutboxRelay] Transactional Outbox worker started.');
  }

  public static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('🛑 [OutboxRelay] Transactional Outbox worker stopped.');
  }

  public static async processBatch(): Promise<number> {
    const pendingEvents = await OutboxService.fetchPendingBatch(infraConfig.OUTBOX_BATCH_SIZE);
    let processedCount = 0;

    for (const record of pendingEvents) {
      try {
        const domainEvent: DomainEvent = {
          eventId: record.id,
          eventType: record.eventType as DomainEventType,
          timestamp: record.createdAt,
          aggregateId: record.aggregateId,
          aggregateType: record.aggregateType as any,
          payload: typeof record.payload === 'string' ? JSON.parse(record.payload) : record.payload,
          version: 1,
        };

        await eventBus.publish(domainEvent);
        await OutboxService.markPublished(record.id);
        processedCount++;
      } catch (err: any) {
        await OutboxService.markFailed(record.id, err.message || 'Unknown publication error');
      }
    }

    return processedCount;
  }
}
