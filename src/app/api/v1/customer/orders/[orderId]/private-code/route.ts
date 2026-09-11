import { NextRequest, NextResponse } from 'next/server';
import { privateDeliveryCodeService } from '@/services/privateDeliveryCodeService';

/**
 * GET /api/v1/customer/orders/[orderId]/private-code
 * Retrieve private delivery confirmation code & inspection session data strictly for authenticated buyer
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || 'usr_1';

    const data = await privateDeliveryCodeService.getCustomerPrivateCode(orderId, customerId);

    if (!data) {
      return NextResponse.json({ success: false, error: 'Order or verification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API /private-code Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve private delivery code' },
      { status: 500 }
    );
  }
}
