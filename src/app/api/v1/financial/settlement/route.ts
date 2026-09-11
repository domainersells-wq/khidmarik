import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/settlement
 * List all escrow settlement records
 */
export async function GET() {
  try {
    const settlements = financialService.getSettlements();
    return NextResponse.json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/financial/settlement
 * Execute escrow settlement: releases funds to seller available wallet idempotently
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required to settle escrow' },
        { status: 400 }
      );
    }

    const result = await financialService.settleOrderEscrow(
      body.orderId,
      body.operator || 'Admin Settlement Desk'
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `Escrow for order ${body.orderId} settled successfully`,
      settlement: result.settlement,
    });
  } catch (error: any) {
    console.error('[API /api/v1/financial/settlement POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to settle order' },
      { status: 500 }
    );
  }
}
