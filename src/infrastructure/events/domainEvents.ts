import { randomUUID } from 'crypto';

export type DomainEventType =
  | 'user.registered'
  | 'provider.approved'
  | 'store.created'
  | 'product.created'
  | 'order.created'
  | 'order.confirmed'
  | 'order.cancelled'
  | 'order.completed'
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'payment.created'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'refund.created'
  | 'refund.completed'
  | 'withdrawal.created'
  | 'withdrawal.completed'
  | 'shipment.created'
  | 'shipment.shipped'
  | 'shipment.delivered'
  | 'review.created'
  | 'dispute.created'
  | 'wallet.updated';

export interface DomainEvent<T = any> {
  eventId: string;
  eventType: DomainEventType;
  timestamp: number;
  aggregateId: string;
  aggregateType: 'order' | 'booking' | 'payment' | 'wallet' | 'user' | 'shipment' | 'dispute' | 'review' | 'store';
  actorId?: string;
  correlationId?: string;
  payload: T;
  version: number;
}

export function createDomainEvent<T>(
  eventType: DomainEventType,
  aggregateType: DomainEvent['aggregateType'],
  aggregateId: string,
  payload: T,
  options?: {
    actorId?: string;
    correlationId?: string;
    version?: number;
  }
): DomainEvent<T> {
  return {
    eventId: randomUUID(),
    eventType,
    timestamp: Date.now(),
    aggregateId,
    aggregateType,
    actorId: options?.actorId,
    correlationId: options?.correlationId || randomUUID(),
    payload,
    version: options?.version || 1,
  };
}
