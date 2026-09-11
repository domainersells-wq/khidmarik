import { NextRequest, NextResponse } from 'next/server';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    // Return sanitized public tracking result (No internal database IDs, secrets, or seller private info)
    const publicTracking = await shippingManagerService.getPublicTracking(trackingNumber);
    if (!publicTracking) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ tracking: publicTracking });
  } catch (error: any) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking', details: error.message }, { status: 500 });
  }
}
