import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * GET /api/v1/customer/orders/[orderId]
 * Fetch customer order details with immutable snapshots and timeline history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await customerOrderService.getOrderDetails(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${orderId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[API /api/v1/customer/orders/[orderId] GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
