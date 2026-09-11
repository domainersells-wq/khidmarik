import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';
import { paymentProviderRegistry } from '@/services/paymentProviderService';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-provider-signature') || request.headers.get('x-satim-signature') || '';
    const idempotencyKey = request.headers.get('idempotency-key') || '';
    const body = await request.json();

    const { provider, eventType, paymentReference, providerTransactionId, amount, currency } = body;

    if (!paymentReference || !amount) {
      return NextResponse.json(
        { success: false, error: 'Payment reference and amount are required' },
        { status: 400 }
      );
    }

    // 1. Find matching TopUpRequest in database / financial store
    const allRequests = financialService.getTopUpRequests();
    const matchingRequest = allRequests.find(
      (r) =>
        (r.postalTransactionCode && r.postalTransactionCode.trim().toLowerCase() === paymentReference.trim().toLowerCase()) ||
        (r.paymentReference && r.paymentReference.trim().toLowerCase() === paymentReference.trim().toLowerCase()) ||
        r.publicRequestNumber === paymentReference
    );

    if (!matchingRequest) {
      // Record unmatched webhook in reconciliation queue for manual audit
      return NextResponse.json({
        success: true,
        status: 'QUEUED_FOR_RECONCILIATION',
        message: 'Payment received but no matching user top-up request found. Sent to reconciliation queue.',
        reference: paymentReference,
      });
    }

    // 2. Idempotency Check: prevent duplicate wallet credit
    if (matchingRequest.status === 'APPROVED' || matchingRequest.status === 'CREDITED') {
      return NextResponse.json({
        success: true,
        status: 'ALREADY_PROCESSED',
        message: 'This transaction was already approved and credited.',
        topUpId: matchingRequest.id,
      });
    }

    // 3. Amount Mismatch Check
    if (Number(matchingRequest.amount) !== Number(amount)) {
      return NextResponse.json({
        success: false,
        status: 'AMOUNT_MISMATCH',
        error: `Amount mismatch: expected ${matchingRequest.amount} DA, received ${amount} DA. Request queued for manual review.`,
      }, { status: 422 });
    }

    // 4. Atomic Approval & Ledger Credit
    const approvalResult = financialService.approveTopUpRequest(
      matchingRequest.id,
      `Webhook (${provider || 'Payment Gateway'})`,
      `Verified and credited automatically via Webhook [Tx: ${providerTransactionId || paymentReference}]`
    );

    return NextResponse.json({
      success: true,
      status: 'CREDITED',
      message: 'Top-up approved and wallet credited successfully.',
      data: approvalResult.topUp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
