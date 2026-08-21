import { NextRequest, NextResponse } from 'next/server';
import { globalEscrowStore } from '@/lib/server/escrowStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { reason, evidence_images = [] } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { success: false, error: 'MISSING_REASON', message: 'A clear dispute reason is required.' },
        { status: 400 }
      );
    }

    const record = globalEscrowStore[orderId];

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'ESCROW_NOT_FOUND', message: `No active escrow record found for order ${orderId}` },
        { status: 404 }
      );
    }

    record.status = 'DISPUTED';
    record.disputeReason = reason;
    record.disputeEvidenceUrls = evidence_images;
    globalEscrowStore[orderId] = record;

    return NextResponse.json({
      success: true,
      orderId,
      status: 'DISPUTED',
      disputeReason: reason,
      evidenceCount: evidence_images.length,
      message: 'Escrow auto-release timer paused. Dispute ticket created in Super Admin Arbitration Center.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
