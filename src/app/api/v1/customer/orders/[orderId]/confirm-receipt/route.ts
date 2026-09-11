import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * POST /api/v1/customer/orders/[orderId]/confirm-receipt
 * Customer confirms receipt: advances to completed and releases escrow to seller
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const customerName = body.customerName || 'Customer';

    const result = await customerOrderService.confirmReceipt(orderId, customerName);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Receipt confirmed successfully and seller escrow funds released',
      order: result.order,
    });
  } catch (error: any) {
    console.error('[API Confirm Receipt Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm receipt' },
      { status: 500 }
    );
  }
}
