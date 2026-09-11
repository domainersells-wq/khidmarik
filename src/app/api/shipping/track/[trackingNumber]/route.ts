import { NextRequest, NextResponse } from 'next/server';
import { shippingService } from '@/services/shipping/shippingService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    const shipment = await shippingService.getShipmentByTrackingNumber(trackingNumber);
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ shipment });
  } catch (error: any) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking', details: error.message }, { status: 500 });
  }
}
