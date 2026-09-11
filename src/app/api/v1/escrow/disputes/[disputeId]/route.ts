import { NextRequest, NextResponse } from 'next/server';
import { escrowDisputeService } from '@/services/escrowDisputeService';

/**
 * GET /api/v1/escrow/disputes/[disputeId]
 * Retrieve full dispute details, evidence gallery, and activity timeline
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params;
    const dispute = escrowDisputeService.getDisputeById(disputeId);

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      dispute,
    });
  } catch (error: any) {
    console.error('[API /escrow/disputes/[disputeId] Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dispute' },
      { status: 500 }
    );
  }
}
