import { NextRequest, NextResponse } from 'next/server';
import { deliveryInspectionService } from '@/services/deliveryInspectionService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const body = await request.json().catch(() => ({}));

    const customerId = body.customerId || body.customer_id || 'usr_customer_default';
    const feedback = body.feedback || body.notes;
    const checklist = body.checklist;

    const session = await deliveryInspectionService.acceptInspectionEarly({
      trackingNumber,
      customerId,
      feedback,
      checklist,
    });

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Early acceptance verified. Private delivery confirmation code is now available.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process early acceptance' }, { status: 400 });
  }
}
