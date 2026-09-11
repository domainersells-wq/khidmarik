import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const body = await request.json().catch(() => ({}));
    const customerId = body.customerId || 'usr_current';

    const result = await deliveryVerificationService.regenerateDeliveryCode({
      trackingNumber,
      customerId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to regenerate delivery code' }, { status: 400 });
  }
}
