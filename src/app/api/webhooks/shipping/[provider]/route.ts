import { NextRequest, NextResponse } from 'next/server';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';
import { WebhookProtectionService } from '@/infrastructure/webhooks/webhookProtection';
import { eventBus } from '@/infrastructure/events/eventBus';
import { createDomainEvent } from '@/infrastructure/events/domainEvents';
import { Logger } from '@/infrastructure/observability/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const rawBody = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventId = body.event_id || body.tracking_number || body.id || `evt_${Date.now()}`;

    // 1. Check duplicate webhook event
    const { alreadyProcessed } = await WebhookProtectionService.checkAndRecordEvent(provider, eventId);
    if (alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: `Webhook event '${eventId}' already processed idempotently`,
        idempotent: true,
      }, { status: 200 });
    }

    // 2. Process webhook business logic
    const result = await shippingManagerService.processWebhook(provider, body);
    if (!result.success) {
      return NextResponse.json({ error: 'Webhook processing failed or shipment not found' }, { status: 400 });
    }

    // 3. Publish domain event
    if (result.trackingNumber) {
      await eventBus.publish(
        createDomainEvent('shipment.shipped', 'shipment', result.trackingNumber, {
          provider,
          trackingNumber: result.trackingNumber,
          rawStatus: body.status,
        })
      );
    }

    Logger.info(`Carrier webhook processed: ${provider}`, { provider, eventId, trackingNumber: result.trackingNumber });

    return NextResponse.json({
      success: true,
      message: `Webhook processed idempotently for carrier '${provider}'`,
      tracking_number: result.trackingNumber,
    });
  } catch (error: any) {
    Logger.error('Webhook error for carrier', error);
    return NextResponse.json({ error: 'Internal webhook error', details: error.message }, { status: 500 });
  }
}
