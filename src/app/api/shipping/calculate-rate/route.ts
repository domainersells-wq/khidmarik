import { NextRequest, NextResponse } from 'next/server';
import { shippingService } from '@/services/shipping/shippingService';
import type { DeliveryType } from '@/types/shipping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fromWilaya = '16 - Alger', 
      toWilaya, 
      weightKg = 1.0, 
      deliveryType = 'home_delivery', 
      isCod = true, 
      orderTotal = 0,
      enabledProviders 
    } = body;

    if (!toWilaya) {
      return NextResponse.json({ error: 'Destination wilaya is required' }, { status: 400 });
    }

    const quotes = await shippingService.calculateShippingQuotes({
      fromWilaya,
      toWilaya,
      weightKg: Number(weightKg),
      deliveryType: deliveryType as DeliveryType,
      isCod: Boolean(isCod),
      orderTotal: Number(orderTotal),
      enabledProviders: Array.isArray(enabledProviders) ? enabledProviders : undefined,
    });

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error('Calculate rate API error:', error);
    return NextResponse.json({ error: 'Failed to calculate rate', details: error.message }, { status: 500 });
  }
}
