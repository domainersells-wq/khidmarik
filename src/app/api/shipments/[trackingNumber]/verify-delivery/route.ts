import { NextRequest, NextResponse } from 'next/server';
import { deliveryVerificationService } from '@/services/deliveryVerificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const body = await request.json().catch(() => ({}));
    const code = body.code || body.otp;
    const deliveryAgentId = body.deliveryAgentId || body.agent_id || 'drv_default';
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await deliveryVerificationService.verifyDeliveryCode({
      trackingNumber,
      code,
      deliveryAgentId,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to verify delivery code' }, { status: 400 });
  }
}
