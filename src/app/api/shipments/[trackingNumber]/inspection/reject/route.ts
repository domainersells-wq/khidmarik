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
    const reasonCode = body.reasonCode || body.reason_code;
    const customerNotes = body.customerNotes || body.notes;
    const evidencePhotos = body.evidencePhotos || body.evidence_photos || [];

    if (!reasonCode) {
      return NextResponse.json({ error: 'Rejection reason code is required' }, { status: 400 });
    }

    const session = await deliveryInspectionService.rejectInspection({
      trackingNumber,
      customerId,
      reasonCode,
      customerNotes,
      evidencePhotos,
    });

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Product rejection recorded. Delivery confirmation code has been disabled.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reject product' }, { status: 400 });
  }
}
