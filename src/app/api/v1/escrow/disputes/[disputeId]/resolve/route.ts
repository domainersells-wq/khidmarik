import { NextRequest, NextResponse } from 'next/server';
import { escrowDisputeService } from '@/services/escrowDisputeService';

/**
 * POST /api/v1/escrow/disputes/[disputeId]/resolve
 * Admin arbitrates dispute: Full Refund, Partial Refund Split, or Fund Release
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params;
    const body = await req.json();

    if (!body.resolutionAction || !body.mediatorNotes) {
      return NextResponse.json(
        { success: false, error: 'Resolution action and mediator notes are required.' },
        { status: 400 }
      );
    }

    const result = await escrowDisputeService.resolveDispute({
      disputeId,
      adminId: body.adminId || 'adm_1',
      adminName: body.adminName || 'Platform Arbiter',
      resolutionAction: body.resolutionAction,
      customerRefundAmount: body.customerRefundAmount,
      providerPayoutAmount: body.providerPayoutAmount,
      mediatorNotes: body.mediatorNotes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute arbitrated and financial settlement executed successfully',
      dispute: result.dispute,
    });
  } catch (error: any) {
    console.error('[API /escrow/disputes/[disputeId]/resolve Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
