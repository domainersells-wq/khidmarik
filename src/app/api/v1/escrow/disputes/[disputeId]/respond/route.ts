import { NextRequest, NextResponse } from 'next/server';
import { escrowDisputeService } from '@/services/escrowDisputeService';

/**
 * POST /api/v1/escrow/disputes/[disputeId]/respond
 * Provider submits response statement and optional partial refund counter-offer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const { disputeId } = await params;
    const body = await req.json();

    if (!body.responseText) {
      return NextResponse.json(
        { success: false, error: 'Provider statement is required.' },
        { status: 400 }
      );
    }

    const result = escrowDisputeService.submitProviderResponse({
      disputeId,
      providerId: body.providerId || 'str_1',
      responseText: body.responseText,
      proposedRefundAmount: body.proposedRefundAmount,
      evidenceUrls: body.evidenceUrls || [],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Provider response submitted successfully',
      dispute: result.dispute,
    });
  } catch (error: any) {
    console.error('[API /escrow/disputes/[disputeId]/respond Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit response' },
      { status: 500 }
    );
  }
}
