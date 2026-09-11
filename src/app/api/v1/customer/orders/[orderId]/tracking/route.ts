import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * GET /api/v1/customer/orders/[orderId]/tracking
 * Return carrier shipping timeline and waybill tracking details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await customerOrderService.getOrderDetails(orderId);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        shippingProvider: order.shippingProvider,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        status: order.status,
        trackingSteps: order.trackingSteps || [],
        statusHistory: order.statusHistory,
      },
    });
  } catch (error: any) {
    console.error('[API Tracking Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
