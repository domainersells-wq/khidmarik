import { TokenBucketLimiter } from '../rate-limit/tokenBucketLimiter';
import { DistributedLock } from '../locks/distributedLock';
import { IdempotencyService } from '../idempotency/idempotencyService';
import { OutboxService } from '../outbox/outboxService';
import { OutboxRelay } from '../outbox/outboxRelay';
import { eventBus } from '../events/eventBus';
import { createDomainEvent } from '../events/domainEvents';
import { HealthService } from '../health/healthService';
import { WebhookProtectionService } from '../webhooks/webhookProtection';

async function runInfrastructureTestSuite() {
  console.log('🧪 Starting Khidmatik Production Infrastructure Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  // ----------------------------------------------------
  // TEST 1: Token Bucket Rate Limiting
  // ----------------------------------------------------
  console.log('1. Testing Token Bucket Rate Limiting...');
  const limitConfig = { capacity: 3, refillRatePerSec: 1 };
  const userA = 'user_test_token_bucket';

  const r1 = await TokenBucketLimiter.consume('test_api', userA, limitConfig, 1);
  assert(r1.allowed === true && r1.remaining === 2, 'First token consumption succeeds (remaining: 2)');

  const r2 = await TokenBucketLimiter.consume('test_api', userA, limitConfig, 2);
  assert(r2.allowed === true && r2.remaining === 0, 'Second token consumption succeeds (remaining: 0)');

  const r3 = await TokenBucketLimiter.consume('test_api', userA, limitConfig, 1);
  assert(r3.allowed === false && r3.retryAfterSeconds >= 1, 'Exceeded capacity is rejected with retryAfter');

  // ----------------------------------------------------
  // TEST 2: Distributed Locking & Mutual Exclusion
  // ----------------------------------------------------
  console.log('\n2. Testing Distributed Locking...');
  const resource = 'khidmatik:lock:order:test_order_99';
  const lock1 = await DistributedLock.acquire(resource, 5000, 0);
  assert(lock1 !== null, 'Acquired distributed lock on order');

  const lock2 = await DistributedLock.acquire(resource, 5000, 0);
  assert(lock2 === null, 'Concurrent acquisition on same resource is rejected');

  if (lock1) {
    const released = await DistributedLock.release(lock1);
    assert(released === true, 'Lock released safely by holder');
  }

  const lock3 = await DistributedLock.acquire(resource, 5000, 0);
  assert(lock3 !== null, 'Resource can be acquired again after release');
  if (lock3) await DistributedLock.release(lock3);

  // ----------------------------------------------------
  // TEST 3: Idempotency Key System
  // ----------------------------------------------------
  console.log('\n3. Testing Idempotency Key System...');
  const idempotencyKey = `idem_test_${Date.now()}`;
  const payloadA = { amount: 5000, recipient: 'seller_123' };
  const payloadB = { amount: 9999, recipient: 'seller_999' };

  const fpA = IdempotencyService.generateFingerprint('POST', '/api/v1/orders', payloadA);
  const fpB = IdempotencyService.generateFingerprint('POST', '/api/v1/orders', payloadB);

  const start1 = await IdempotencyService.startProcessing(idempotencyKey, fpA);
  assert(start1 === true, 'Started processing initial idempotent request');

  const record1 = await IdempotencyService.getRecord(idempotencyKey);
  assert(record1?.status === 'PROCESSING', 'Record is in PROCESSING status');
  assert(record1?.fingerprint !== fpB, 'Detects fingerprint mismatch for different payload');

  await IdempotencyService.complete(idempotencyKey, fpA, 201, { orderId: 'ord_123', status: 'PAID' });
  const record2 = await IdempotencyService.getRecord(idempotencyKey);
  assert(record2?.status === 'COMPLETED' && record2.responseBody.orderId === 'ord_123', 'Completed record contains cached response body');

  // ----------------------------------------------------
  // TEST 4: Transactional Outbox Pattern & Event Bus
  // ----------------------------------------------------
  console.log('\n4. Testing Outbox Pattern & Event Bus...');
  let eventReceived: boolean = false;
  const unsubscribe = eventBus.subscribe('order.created', async (evt) => {
    if (evt.aggregateId === 'ord_test_outbox') {
      eventReceived = true;
    }
  });

  const testEvent = createDomainEvent('order.created', 'order', 'ord_test_outbox', { total: 15000 });
  await OutboxService.recordEvent(null, testEvent);
  const processed = await OutboxRelay.processBatch();
  assert(processed >= 1, 'Outbox relay processed pending event batch');
  assert(Boolean(eventReceived), 'Event subscriber successfully received domain event');
  unsubscribe();

  // ----------------------------------------------------
  // TEST 5: Webhook Protection & Deduplication
  // ----------------------------------------------------
  console.log('\n5. Testing Webhook Protection...');
  const webhookId = `evt_yalidine_${Date.now()}`;
  const w1 = await WebhookProtectionService.checkAndRecordEvent('yalidine', webhookId);
  assert(!w1.alreadyProcessed, 'First webhook event is accepted');

  const w2 = await WebhookProtectionService.checkAndRecordEvent('yalidine', webhookId);
  assert(w2.alreadyProcessed, 'Duplicate webhook event is deduplicated');

  // ----------------------------------------------------
  // TEST 6: Health Service & Readiness
  // ----------------------------------------------------
  console.log('\n6. Testing Health Service...');
  const liveness = await HealthService.getLiveness();
  assert(liveness.status === 'ok' && liveness.uptime >= 0, 'Liveness health check returns ok');

  const readiness = await HealthService.getReadiness();
  assert(['healthy', 'degraded', 'unhealthy'].includes(readiness.status), 'Readiness check returns structured report');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runInfrastructureTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
