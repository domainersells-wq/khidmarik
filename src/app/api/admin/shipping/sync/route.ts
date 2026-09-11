import { NextRequest, NextResponse } from 'next/server';
import { shippingSyncService } from '@/services/shipping/ShippingSyncService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider_id = 'yalidine' } = body;

    const result = await shippingSyncService.syncProviderShipments(provider_id);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Carrier sync API error:', error);
    return NextResponse.json({ error: 'Failed to sync carrier', details: error.message }, { status: 500 });
  }
}
