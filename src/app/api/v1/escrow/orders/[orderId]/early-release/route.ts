import { NextRequest, NextResponse } from 'next/server';
import { escrowDisputeService } from '@/services/escrowDisputeService';

/**
 * POST /api/v1/escrow/orders/[orderId]/early-release
 * Customer initiates early release of escrow funds to provider
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const customerId = body.customerId || 'usr_1';
    const reason = body.reason || 'Customer early release of escrow';

    const result = await escrowDisputeService.earlyReleaseFunds(orderId, customerId, reason);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('[API /escrow/orders/[orderId]/early-release Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to early release funds' },
      { status: 500 }
    );
  }
}
