import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';

/**
 * GET /api/v1/orders/[orderId]/rejection-preview?reasonCode=changed_mind
 * Return live server-side recalculation of customer refund & deductions before rejection confirmation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(req.url);
    const reasonCode = searchParams.get('reasonCode') || 'changed_mind';

    const order = await customerOrderService.getOrderDetails(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const calculation = rejectionCostAllocationService.calculateCostAllocation(
      order,
      reasonCode,
      (order as any).sellerSubscriptionPlan || 'pro'
    );

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    console.error('[API /rejection-preview Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate rejection preview' },
      { status: 500 }
    );
  }
}
