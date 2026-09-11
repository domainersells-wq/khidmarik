import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

/**
 * POST /api/v1/delivery/orders/[orderId]/verify
 * Delivery courier / Store clerk submits 6-digit OTP to complete delivery
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'Delivery verification code is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Khidmatik-Delivery-Client';

    const result = await deliveryVerificationService.verifyDeliveryCode({
      orderId,
      code: body.code,
      agentId: body.agentId || 'agt_yalidine_01',
      agentRole: body.agentRole || 'DELIVERY_AGENT',
      agentName: body.agentName || 'Yalidine Delivery Courier',
      ipAddress: ip,
      userAgent,
    });

    if (!result.success) {
      const statusCode = result.isLocked ? 423 : 422;
      return NextResponse.json(
        {
          success: false,
          status: result.status,
          error: result.error,
          remainingAttempts: result.remainingAttempts,
          isLocked: result.isLocked,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery successfully verified via customer OTP',
      orderNumber: result.orderNumber,
      verifiedAt: result.verifiedAt,
    });
  } catch (error: any) {
    console.error('[API /delivery/orders/[orderId]/verify Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify delivery code' },
      { status: 500 }
    );
  }
}
