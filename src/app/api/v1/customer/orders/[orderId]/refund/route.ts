import { NextRequest, NextResponse } from 'next/server';
import { customerOrderService } from '@/services/customerOrderService';

/**
 * POST /api/v1/customer/orders/[orderId]/refund
 * Customer submits refund claim with evidence
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    if (!body.reason || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Reason and description are required for refund requests' },
        { status: 400 }
      );
    }

    const result = await customerOrderService.requestRefund(
      orderId,
      body.reason,
      body.description,
      body.evidenceUrls || [],
      body.customerName || 'Customer'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted to seller review',
      order: result.order,
    });
  } catch (error: any) {
    console.error('[API Request Refund Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit refund request' },
      { status: 500 }
    );
  }
}
