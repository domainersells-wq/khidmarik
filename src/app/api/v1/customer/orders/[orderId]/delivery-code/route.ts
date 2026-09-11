import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

/**
 * GET /api/v1/customer/orders/[orderId]/delivery-code
 * Retrieve active 6-digit delivery OTP for authenticated customer
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || 'usr_1';

    const data = await deliveryVerificationService.getCustomerDeliveryCode(orderId, customerId);

    if (!data) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API /delivery-code Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve delivery code' },
      { status: 500 }
    );
  }
}
