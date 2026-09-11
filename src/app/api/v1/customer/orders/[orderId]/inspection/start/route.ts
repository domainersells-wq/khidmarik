import { NextRequest, NextResponse } from 'next/server';
import { privateDeliveryCodeService } from '@/services/privateDeliveryCodeService';

/**
 * POST /api/v1/customer/orders/[orderId]/inspection/start
 * Start customer delivery inspection countdown timer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const customerId = body.customerId || 'usr_1';

    const session = await privateDeliveryCodeService.startInspectionSession(orderId, customerId);

    return NextResponse.json({
      success: true,
      message: 'Inspection session started',
      session,
    });
  } catch (error: any) {
    console.error('[API /inspection/start Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start inspection' },
      { status: 500 }
    );
  }
}
