import { NextRequest, NextResponse } from 'next/server';
import { globalEscrowStore } from '@/lib/server/escrowStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const record = globalEscrowStore[orderId];

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'ESCROW_NOT_FOUND', message: `No active escrow record found for order ${orderId}` },
        { status: 404 }
      );
    }

    if (!['HELD', 'DELIVERED'].includes(record.status)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_STATUS', message: `Cannot release escrow with status: ${record.status}` },
        { status: 400 }
      );
    }

    const ledgerRef = `LEDGER-ESCROW-${orderId}-${Math.floor(100000 + Math.random() * 900000)}`;

    record.status = 'RELEASED';
    record.releasedAt = new Date().toISOString();
    globalEscrowStore[orderId] = record;

    return NextResponse.json({
      success: true,
      orderId,
      status: 'RELEASED',
      payeeNetPayoutDA: record.payeeNetDA,
      platformFeeDA: record.platformFeeDA,
      ledgerReference: ledgerRef,
      message: `Buyer approved early release. Net amount ${record.payeeNetDA} DA credited to seller wallet with immutable ledger trail.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
