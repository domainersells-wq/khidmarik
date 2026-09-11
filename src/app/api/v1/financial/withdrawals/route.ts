import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/withdrawals
 * List withdrawal requests
 */
export async function GET(req: NextRequest) {
  try {
    const withdrawals = financialService.getWithdrawals();
    return NextResponse.json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/financial/withdrawals
 * Either submit a new withdrawal request or execute admin approval/rejection action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Admin Action: Approve
    if (body.action === 'approve') {
      if (!body.withdrawalId) {
        return NextResponse.json({ success: false, error: 'withdrawalId is required' }, { status: 400 });
      }
      const res = await financialService.approveWithdrawal(
        body.withdrawalId,
        body.adminOperator || 'Super Admin',
        body.transferProofReference
      );
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 422 });
      return NextResponse.json({ success: true, message: 'Withdrawal approved & completed', withdrawal: res.withdrawal });
    }

    // 2. Admin Action: Reject
    if (body.action === 'reject') {
      if (!body.withdrawalId || !body.reason) {
        return NextResponse.json({ success: false, error: 'withdrawalId and reason are required' }, { status: 400 });
      }
      const res = await financialService.rejectWithdrawal(
        body.withdrawalId,
        body.reason,
        body.adminOperator || 'Super Admin'
      );
      if (!res.success) return NextResponse.json({ success: false, error: res.error }, { status: 422 });
      return NextResponse.json({ success: true, message: 'Withdrawal rejected & funds unlocked', withdrawal: res.withdrawal });
    }

    // 3. New Withdrawal Request
    if (!body.sellerId || !body.requestedAmount || !body.bankOrCCP || !body.accountNumber || !body.ripNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required withdrawal fields: sellerId, requestedAmount, bankOrCCP, accountNumber, ripNumber',
        },
        { status: 400 }
      );
    }

    const result = await financialService.requestWithdrawal(
      body.sellerId,
      Number(body.requestedAmount),
      body.bankOrCCP,
      body.accountNumber,
      body.ripNumber
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request created successfully and funds locked for review',
      withdrawal: result.withdrawal,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/v1/financial/withdrawals POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
