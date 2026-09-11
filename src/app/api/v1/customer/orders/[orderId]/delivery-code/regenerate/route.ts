import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

/**
 * POST /api/v1/customer/orders/[orderId]/delivery-code/regenerate
 * Customer regenerates delivery verification OTP
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const customerId = body.customerId || 'usr_1';
    const reason = body.reason || 'Customer requested regeneration';

    const result = await deliveryVerificationService.regenerateDeliveryCode(orderId, customerId, reason);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'New delivery verification code generated successfully',
      data: result.data,
    });
  } catch (error: any) {
    console.error('[API /delivery-code/regenerate Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to regenerate delivery code' },
      { status: 500 }
    );
  }
}
