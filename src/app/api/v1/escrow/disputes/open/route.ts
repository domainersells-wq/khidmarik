import { NextRequest, NextResponse } from 'next/server';
import { escrowDisputeService } from '@/services/escrowDisputeService';

/**
 * POST /api/v1/escrow/disputes/open
 * Customer opens a formal dispute on an order
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderId || !body.reasonCode || !body.claimDescription) {
      return NextResponse.json(
        { success: false, error: 'Order ID, reason code, and claim description are required.' },
        { status: 400 }
      );
    }

    const result = await escrowDisputeService.openDispute({
      orderId: body.orderId,
      customerId: body.customerId || 'usr_1',
      customerName: body.customerName,
      reasonCode: body.reasonCode,
      claimDescription: body.claimDescription,
      evidenceUrls: body.evidenceUrls || [],
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Dispute opened and escrow payment locked successfully',
      dispute: result.dispute,
    });
  } catch (error: any) {
    console.error('[API /escrow/disputes/open Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to open dispute' },
      { status: 500 }
    );
  }
}
