import { NextRequest, NextResponse } from 'next/server';
import { unifiedOrderService } from '@/services/unifiedOrderService';
import { UnifiedOrderSource, UnifiedOrderStatus } from '@/types/unifiedOrder';
import { checkRateLimit, applyRateLimitHeaders } from '@/infrastructure/rate-limit/rateLimitMiddleware';
import { handleIdempotencyPreCheck, saveIdempotentResponse, releaseIdempotentKey } from '@/infrastructure/idempotency/idempotencyMiddleware';
import { DistributedLock } from '@/infrastructure/locks/distributedLock';
import { RedisKeys } from '@/infrastructure/redis/redisNamespace';
import { OutboxService } from '@/infrastructure/outbox/outboxService';
import { createDomainEvent } from '@/infrastructure/events/domainEvents';
import { Logger } from '@/infrastructure/observability/logger';
import { RequestContext } from '@/infrastructure/observability/requestContext';

/**
 * GET /api/v1/orders
 * Query unified orders across Marketplace, Store, Professional Services, Craftsmen, and Halls
 */
export async function GET(req: NextRequest) {
  const ctx = RequestContext.extract(req);

  // 1. Rate limiting check
  const rateLimit = await checkRateLimit(req, 'AUTHENTICATED');
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const source = (searchParams.get('source') as UnifiedOrderSource) || undefined;
    const status = (searchParams.get('status') as UnifiedOrderStatus) || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const sellerId = searchParams.get('sellerId') || undefined;
    const search = searchParams.get('search') || undefined;

    const orders = await unifiedOrderService.getOrders({
      source,
      status,
      customerId,
      sellerId,
      search,
    });

    const response = NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });

    return applyRateLimitHeaders(response, rateLimit.result);
  } catch (error: any) {
    Logger.error('Failed to fetch orders', error, { ...ctx, endpoint: '/api/v1/orders' });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/orders
 * Create a unified order with line items, financial totals, idempotency, and distributed locking
 */
export async function POST(req: NextRequest) {
  const ctx = RequestContext.extract(req);

  // 1. Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'AUTHENTICATED');
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  // 2. Idempotency Pre-Check
  const idempotency = await handleIdempotencyPreCheck(req, body);
  if (idempotency.isDuplicate) {
    if (idempotency.errorResponse) return idempotency.errorResponse;
    if (idempotency.cachedResponse) return idempotency.cachedResponse;
  }

  try {
    // Basic validation
    if (!body.source || !body.customer || !body.sellerOrProvider || !body.items || body.items.length === 0) {
      if (idempotency.key) await releaseIdempotentKey(idempotency.key);
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required order fields: source, customer, sellerOrProvider, items',
        },
        { status: 400 }
      );
    }

    // 3. Distributed Lock to prevent duplicate concurrent order creation on same customer/cart
    const lockKey = RedisKeys.lockOrder(body.customer.id || 'anonymous_customer');

    const createdOrder = await DistributedLock.withLock(lockKey, 10000, async () => {
      const order = await unifiedOrderService.createOrder({
        source: body.source,
        customer: body.customer,
        sellerOrProvider: body.sellerOrProvider,
        items: body.items,
        shippingFee: body.shippingFee,
        serviceFee: body.serviceFee,
        discountAmount: body.discountAmount,
        couponCode: body.couponCode,
        paymentMethod: body.paymentMethod || 'cash_on_delivery',
        courier: body.courier,
        initialNotes: body.initialNotes,
      });

      // 4. Transactional Outbox Event
      const orderCreatedEvent = createDomainEvent(
        'order.created',
        'order',
        order.id,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customer.id,
          sellerId: order.sellerOrProvider.id,
          totalAmount: order.financials.totalAmount,
          source: order.source,
        },
        { correlationId: ctx.correlationId, actorId: ctx.userId }
      );

      await OutboxService.recordEvent(null, orderCreatedEvent);

      return order;
    });

    const responseData = {
      success: true,
      message: 'Unified order created successfully',
      order: createdOrder,
    };

    // 5. Save Idempotency response
    if (idempotency.key) {
      await saveIdempotentResponse(idempotency.key, idempotency.fingerprint, 201, responseData);
    }

    Logger.info(`Order created successfully: ${createdOrder.id}`, {
      ...ctx,
      orderId: createdOrder.id,
      total: createdOrder.financials.totalAmount,
    });

    const response = NextResponse.json(responseData, { status: 201 });
    return applyRateLimitHeaders(response, rateLimit.result);
  } catch (error: any) {
    if (idempotency.key) await releaseIdempotentKey(idempotency.key);
    Logger.error('Failed to create order', error, { ...ctx, endpoint: '/api/v1/orders' });

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
