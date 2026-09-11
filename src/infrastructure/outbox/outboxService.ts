import { PoolClient } from 'pg';
import { DomainEvent } from '../events/domainEvents';
import { dbPool } from '../database/dbPool';

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';

export interface OutboxRecord {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  status: OutboxStatus;
  retryCount: number;
  lastError?: string;
  createdAt: number;
  publishedAt?: number;
}

export class OutboxService {
  // In-memory fallback
  private static memoryOutbox: Map<string, OutboxRecord> = new Map();

  /**
   * Insert a domain event into the outbox table within the caller's DB transaction
   */
  public static async recordEvent(
    client: PoolClient | null,
    event: DomainEvent
  ): Promise<void> {
    const record: OutboxRecord = {
      id: event.eventId,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      status: 'PENDING',
      retryCount: 0,
      createdAt: event.timestamp,
    };

    if (client) {
      try {
        const query = `
          INSERT INTO outbox_events (
            id, event_type, aggregate_type, aggregate_id, payload, status, retry_count, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
        await client.query(query, [
          record.id,
          record.eventType,
          record.aggregateType,
          record.aggregateId,
          JSON.stringify(record.payload),
          record.status,
          record.retryCount,
        ]);
        return;
      } catch (err: any) {
        console.error('[OutboxService] Failed to insert SQL outbox event:', err.message);
      }
    }

    // Memory fallback
    this.memoryOutbox.set(record.id, record);
  }

  public static async fetchPendingBatch(limit: number = 50): Promise<OutboxRecord[]> {
    if (dbPool.isAvailable()) {
      try {
        const query = `
          SELECT id, event_type as "eventType", aggregate_type as "aggregateType",
                 aggregate_id as "aggregateId", payload, status, retry_count as "retryCount",
                 EXTRACT(EPOCH FROM created_at)*1000 as "createdAt"
          FROM outbox_events
          WHERE status = 'PENDING' OR (status = 'FAILED' AND retry_count < 5)
          ORDER BY created_at ASC
          LIMIT $1
        `;
        const res = await dbPool.query<OutboxRecord>(query, [limit]);
        return res.rows;
      } catch (err) {
        // Fallback to memory
      }
    }

    return Array.from(this.memoryOutbox.values())
      .filter((r) => r.status === 'PENDING' || (r.status === 'FAILED' && r.retryCount < 5))
      .slice(0, limit);
  }

  public static async markPublished(id: string): Promise<void> {
    if (dbPool.isAvailable()) {
      try {
        await dbPool.query(
          `UPDATE outbox_events SET status = 'PUBLISHED', published_at = NOW() WHERE id = $1`,
          [id]
        );
      } catch (err) {
        // Ignore
      }
    }

    const rec = this.memoryOutbox.get(id);
    if (rec) {
      rec.status = 'PUBLISHED';
      rec.publishedAt = Date.now();
    }
  }

  public static async markFailed(id: string, error: string): Promise<void> {
    if (dbPool.isAvailable()) {
      try {
        await dbPool.query(
          `UPDATE outbox_events SET status = 'FAILED', retry_count = retry_count + 1, last_error = $2 WHERE id = $1`,
          [id, error]
        );
      } catch (err) {
        // Ignore
      }
    }

    const rec = this.memoryOutbox.get(id);
    if (rec) {
      rec.status = 'FAILED';
      rec.retryCount += 1;
      rec.lastError = error;
    }
  }
}
