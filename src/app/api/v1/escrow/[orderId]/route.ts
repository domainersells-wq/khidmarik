import { NextRequest, NextResponse } from 'next/server';
import { globalEscrowStore } from '@/lib/server/escrowStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const record = globalEscrowStore[orderId];

  if (!record) {
    return NextResponse.json(
      { success: false, error: 'ESCROW_NOT_FOUND', message: `No escrow transaction found for order ${orderId}` },
      { status: 404 }
    );
  }

  const now = Date.now();
  let hoursRemaining = 0;
  if (record.status === 'DELIVERED' && record.protectionEndsAt) {
    const endsMs = new Date(record.protectionEndsAt).getTime();
    hoursRemaining = Math.max(0, Math.round((endsMs - now) / (1000 * 3600)));
  }

  return NextResponse.json({
    success: true,
    data: {
      ...record,
      hoursRemaining
    }
  });
}
