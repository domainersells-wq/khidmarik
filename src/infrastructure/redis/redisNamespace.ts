import { infraConfig } from '../config/env';

export const RedisNamespace = {
  RATE_LIMIT: 'rate-limit',
  LOCK: 'lock',
  IDEMPOTENCY: 'idempotency',
  CACHE: 'cache',
  EVENT: 'event',
  SESSION: 'session',
  QUEUE: 'queue',
} as const;

export type RedisNamespaceType = typeof RedisNamespace[keyof typeof RedisNamespace];

export function buildRedisKey(
  namespace: RedisNamespaceType,
  subsystem: string,
  identifier: string | number
): string {
  return `${infraConfig.REDIS_KEY_PREFIX}:${namespace}:${subsystem}:${identifier}`;
}

export const RedisKeys = {
  rateLimit: (endpoint: string, identifier: string) =>
    buildRedisKey(RedisNamespace.RATE_LIMIT, endpoint, identifier),
  
  lockOrder: (orderId: string) =>
    buildRedisKey(RedisNamespace.LOCK, 'order', orderId),
  
  lockWallet: (walletId: string) =>
    buildRedisKey(RedisNamespace.LOCK, 'wallet', walletId),
  
  lockProduct: (productId: string) =>
    buildRedisKey(RedisNamespace.LOCK, 'product', productId),
  
  lockWithdrawal: (withdrawalId: string) =>
    buildRedisKey(RedisNamespace.LOCK, 'withdrawal', withdrawalId),

  lockBooking: (bookingId: string) =>
    buildRedisKey(RedisNamespace.LOCK, 'booking', bookingId),

  idempotency: (key: string) =>
    buildRedisKey(RedisNamespace.IDEMPOTENCY, 'key', key),

  cacheProduct: (productId: string) =>
    buildRedisKey(RedisNamespace.CACHE, 'product', productId),

  cacheStore: (storeId: string) =>
    buildRedisKey(RedisNamespace.CACHE, 'store', storeId),

  eventStream: (eventName: string) =>
    buildRedisKey(RedisNamespace.EVENT, 'stream', eventName),
};
