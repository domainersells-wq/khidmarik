import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * POST /api/v1/customer/orders/[orderId]/cancel
 * Customer cancels unfulfilled order
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    if (!body.reason) {
      return NextResponse.json({ success: false, error: 'Cancellation reason is required' }, { status: 400 });
    }

    const result = await customerOrderService.cancelOrder(
      orderId,
      body.reason,
      body.customerName || 'Customer'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: result.order,
    });
  } catch (error: any) {
    console.error('[API Cancel Order Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
