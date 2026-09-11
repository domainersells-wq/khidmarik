import { NextRequest, NextResponse } from 'next/server';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';

/**
 * POST /api/v1/customer/orders/[orderId]/reject
 * Customer rejects order at delivery handover -> triggers cost allocation & refund calculation
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    if (!body.reasonCode) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason code is required.' },
        { status: 400 }
      );
    }

    const result = await rejectionCostAllocationService.submitOrderRejection({
      orderId,
      customerId: body.customerId || 'usr_1',
      reasonCode: body.reasonCode,
      customerNotes: body.customerNotes,
      evidenceUrls: body.evidenceUrls || [],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order delivery rejection recorded and costs allocated successfully',
      allocation: result.allocation,
    });
  } catch (error: any) {
    console.error('[API /customer/orders/[orderId]/reject Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process order rejection' },
      { status: 500 }
    );
  }
}
