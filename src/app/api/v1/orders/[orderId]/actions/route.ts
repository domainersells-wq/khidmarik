import { NextRequest, NextResponse } from 'next/server';
import { unifiedOrderService } from '@/services/unifiedOrderService';

/**
 * POST /api/v1/orders/[orderId]/actions
 * Dedicated business operations: cancel, refund, dispute, tracking
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const action = body.action;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action parameter is required (cancel, refund, dispute, resolve_dispute, tracking)' },
        { status: 400 }
      );
    }

    let result: any = { success: false, error: 'Unknown action' };

    switch (action) {
      case 'cancel':
        if (!body.reason) {
          return NextResponse.json({ success: false, error: 'Cancellation reason is required' }, { status: 400 });
        }
        result = await unifiedOrderService.cancelOrder(
          orderId,
          body.reason,
          body.operator || 'User',
          body.operatorRole || 'CUSTOMER'
        );
        break;

      case 'refund':
        if (!body.amount) {
          return NextResponse.json({ success: false, error: 'Refund amount is required' }, { status: 400 });
        }
        result = await unifiedOrderService.issueRefund(
          orderId,
          Number(body.amount),
          body.reason || 'Customer refund',
          body.operator || 'Admin',
          body.operatorRole || 'ADMIN'
        );
        break;

      case 'dispute':
        if (!body.reason) {
          return NextResponse.json({ success: false, error: 'Dispute reason is required' }, { status: 400 });
        }
        result = await unifiedOrderService.openDispute(
          orderId,
          body.reason,
          Number(body.claimAmount || 0),
          body.operator || 'Customer',
          body.operatorRole || 'CUSTOMER'
        );
        break;

      case 'resolve_dispute':
        if (!body.resolution) {
          return NextResponse.json({ success: false, error: 'Dispute resolution is required (REFUND_BUYER, PAY_SELLER, DISMISSED)' }, { status: 400 });
        }
        result = await unifiedOrderService.resolveDispute(
          orderId,
          body.resolution,
          body.notes || 'Settled by mediator',
          body.operator || 'Super Admin'
        );
        break;

      case 'tracking':
        if (!body.trackingNumber || !body.courier) {
          return NextResponse.json({ success: false, error: 'Tracking number and courier are required' }, { status: 400 });
        }
        result = await unifiedOrderService.updateTracking(
          orderId,
          body.courier,
          body.trackingNumber,
          body.operator || 'Merchant'
        );
        break;

      default:
        return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed successfully`,
      order: result.order,
    });
  } catch (error: any) {
    console.error('[API /api/v1/orders/[orderId]/actions Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute order action' },
      { status: 500 }
    );
  }
}
