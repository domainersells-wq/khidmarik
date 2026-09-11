import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/refunds
 * List all refund records
 */
export async function GET() {
  try {
    const refunds = financialService.getRefunds();
    return NextResponse.json({
      success: true,
      count: refunds.length,
      refunds,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/financial/refunds
 * Process full or partial refund
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderId || !body.amount || !body.reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required refund fields: orderId, amount, reason' },
        { status: 400 }
      );
    }

    const result = await financialService.processRefund(
      body.orderId,
      Number(body.amount),
      body.reason,
      body.operator || 'Super Admin',
      Boolean(body.isPartial),
      body.adminNotes
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `${body.isPartial ? 'Partial' : 'Full'} refund processed successfully`,
      refund: result.refund,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/v1/financial/refunds POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
