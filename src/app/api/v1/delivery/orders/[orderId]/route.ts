import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * GET /api/v1/delivery/orders/[orderId]
 * Courier lookup of parcel details (recipient, address, items) without exposing OTP
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

    // Return delivery information sanitized (NO OTP, NO HASH)
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.shippingAddress.recipientName,
        customerPhone: order.shippingAddress.phone,
        storeName: order.storeName,
        shippingAddress: order.shippingAddress,
        shippingProvider: order.shippingProvider,
        trackingNumber: order.trackingNumber,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        itemsCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
        items: order.items.map((i) => ({
          productName: i.productName,
          variantName: i.variantName,
          quantity: i.quantity,
        })),
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[API /delivery/orders/[orderId] GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch delivery order' },
      { status: 500 }
    );
  }
}
