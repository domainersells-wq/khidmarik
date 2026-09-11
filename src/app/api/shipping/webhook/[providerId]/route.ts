import { NextRequest, NextResponse } from 'next/server';
import { shippingService } from '@/services/shipping/shippingService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const body = await request.json();

    const result = await shippingService.processWebhook(providerId, body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid webhook payload or missing tracking number' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook processed for ${providerId}`, 
      trackingNumber: result.trackingNumber 
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
  }
}
