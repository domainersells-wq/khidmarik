import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || 'usr_current';

    const data = await deliveryVerificationService.getCustomerDeliveryCode({
      trackingNumber,
      customerId,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get confirmation code' }, { status: 400 });
  }
}
