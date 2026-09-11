import { NextRequest, NextResponse } from 'next/server';
import { unifiedOrderService } from '@/services/unifiedOrderService';
import { UnifiedOrderStatus } from '@/types/unifiedOrder';

/**
 * GET /api/v1/orders/[orderId]
 * Fetch single order with complete line items, customer, seller, financials, and timeline
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await unifiedOrderService.getOrderById(orderId);

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
    console.error('[API /api/v1/orders/[orderId] GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/orders/[orderId]
 * Execute a strictly validated state transition
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    const targetStatus = body.status as UnifiedOrderStatus;
    if (!targetStatus) {
      return NextResponse.json(
        { success: false, error: 'Target status is required in body.status' },
        { status: 400 }
      );
    }

    const operator = body.operator || 'System Operator';
    const operatorRole = body.operatorRole || 'ADMIN';
    const notes = body.notes;
    const context = body.context;

    const result = await unifiedOrderService.transitionStatus(
      orderId,
      targetStatus,
      operator,
      operatorRole,
      notes,
      context
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Order transitioned to ${targetStatus}`,
      order: result.order,
    });
  } catch (error: any) {
    console.error('[API /api/v1/orders/[orderId] PATCH Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to transition order status' },
      { status: 500 }
    );
  }
}
