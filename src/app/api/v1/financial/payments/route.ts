import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

/**
 * GET /api/v1/financial/payments
 * List payment records with filters
 */
export async function GET(req: NextRequest) {
  try {
    const payments = financialService.getPayments();
    return NextResponse.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error: any) {
    console.error('[API /api/v1/financial/payments GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/financial/payments
 * Record a customer payment with server-side pricing & idempotency protection
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orderId || !body.sellerId || !body.amount || !body.method || !body.idempotencyKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment parameters: orderId, sellerId, amount, method, idempotencyKey',
        },
        { status: 400 }
      );
    }

    const result = await financialService.recordCustomerPayment({
      orderId: body.orderId,
      orderSource: body.orderSource || 'store',
      payerId: body.payerId || 'cust_anonymous',
      payerName: body.payerName || 'Customer',
      payerPhone: body.payerPhone || '+213 000 00 00 00',
      sellerId: body.sellerId,
      amount: Number(body.amount),
      method: body.method,
      gatewayTransactionId: body.gatewayTransactionId,
      idempotencyKey: body.idempotencyKey,
      ipAddress: body.ipAddress,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded and escrow hold established',
      payment: result.payment,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/v1/financial/payments POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    );
  }
}
