import { DomainEvent, DomainEventType } from './domainEvents';
import { redisManager } from '../redis/redisClient';
import { RedisKeys } from '../redis/redisNamespace';

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

export class EventBus {
  private static instance: EventBus | null = null;
  private handlers: Map<DomainEventType | '*', Set<EventHandler>> = new Map();
  private processedEvents: Set<string> = new Set(); // in-memory idempotency deduplicator

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to a domain event
   */
  public subscribe<T = any>(eventType: DomainEventType | '*', handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Publish an event reliably to Redis Stream and local subscribers
   */
  public async publish<T = any>(event: DomainEvent<T>): Promise<void> {
    // 1. Deduplicate check
    if (this.processedEvents.has(event.eventId)) {
      return;
    }

    const client = redisManager.getClient();
    const streamKey = RedisKeys.eventStream(event.eventType);

    // 2. Publish to Redis Stream for durable multi-instance distribution
    if (redisManager.isHealthy() && client) {
      try {
        await client.xadd(
          streamKey,
          '*',
          'eventId', event.eventId,
          'eventType', event.eventType,
          'aggregateId', event.aggregateId,
          'payload', JSON.stringify(event.payload),
          'timestamp', event.timestamp.toString(),
          'correlationId', event.correlationId || ''
        );
      } catch (err: any) {
        console.warn(`[EventBus] Redis Stream publication warning for ${event.eventType}:`, err.message);
      }
    }

    // 3. Dispatch to local subscribers asynchronously without blocking caller
    this.dispatchLocal(event);
  }

  private async dispatchLocal<T>(event: DomainEvent<T>): Promise<void> {
    const specificHandlers = this.handlers.get(event.eventType) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();
    const allHandlers = [...specificHandlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(event);
      } catch (handlerErr: any) {
        console.error(`[EventBus] Error in subscriber handling '${event.eventType}':`, handlerErr.message);
      }
    }

    // Track processed event ID
    this.processedEvents.add(event.eventId);
    if (this.processedEvents.size > 10000) {
      // Periodic pruning
      const toDelete = Array.from(this.processedEvents).slice(0, 2000);
      toDelete.forEach((id) => this.processedEvents.delete(id));
    }
  }
}

export const eventBus = EventBus.getInstance();
