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

    if (record.status !== 'HELD') {
      return NextResponse.json(
        { success: false, error: 'INVALID_TRANSITION', message: `Cannot confirm delivery for escrow in status: ${record.status}` },
        { status: 400 }
      );
    }

    const protectionMs = record.protectionDurationHours * 3600 * 1000;
    const endsAt = new Date(Date.now() + protectionMs).toISOString();

    record.status = 'DELIVERED';
    record.deliveredAt = new Date().toISOString();
    record.protectionEndsAt = endsAt;
    globalEscrowStore[orderId] = record;

    return NextResponse.json({
      success: true,
      orderId,
      status: 'DELIVERED',
      deliveredAt: record.deliveredAt,
      protectionEndsAt: endsAt,
      protectionHoursRemaining: record.protectionDurationHours,
      message: `Delivery confirmed. Buyer protection window started. Auto-release in ${record.protectionDurationHours} hours unless disputed.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
