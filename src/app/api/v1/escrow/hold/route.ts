import { NextRequest, NextResponse } from 'next/server';
import { globalEscrowStore, EscrowStoreRecord } from '@/lib/server/escrowStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      order_type = 'service',
      payer_id,
      payee_id,
      total_amount,
      spare_parts_amount = 0,
      protection_duration_hours = 48,
      commission_rate = 0.05
    } = body;

    if (!order_id || !total_amount || !payer_id || !payee_id) {
      return NextResponse.json(
        { success: false, error: 'MISSING_REQUIRED_FIELDS', message: 'order_id, total_amount, payer_id, and payee_id are required.' },
        { status: 400 }
      );
    }

    const totalAmountDA = Number(total_amount);
    const sparePartsDA = Number(spare_parts_amount);
    const platformFeeDA = Math.round((totalAmountDA - sparePartsDA) * Number(commission_rate));
    const payeeNetDA = totalAmountDA - platformFeeDA;
    const escrowId = `ESC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newEscrow: EscrowStoreRecord = {
      id: escrowId,
      orderId: order_id,
      orderType: order_type,
      payerId: payer_id,
      payeeId: payee_id,
      totalAmountDA,
      platformFeeDA,
      payeeNetDA,
      sparePartsAmountDA: sparePartsDA,
      status: 'HELD',
      protectionDurationHours: Number(protection_duration_hours),
      heldAt: new Date().toISOString()
    };

    globalEscrowStore[order_id] = newEscrow;

    return NextResponse.json({
      success: true,
      escrowId,
      orderId: order_id,
      status: 'HELD',
      totalLockedDA: totalAmountDA,
      platformFeeDA,
      payeeNetDA,
      message: `Escrow vault locked ${totalAmountDA} DA securely. Provider notified to start order execution.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
