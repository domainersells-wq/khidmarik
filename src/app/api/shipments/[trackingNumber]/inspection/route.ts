import { NextRequest, NextResponse } from 'next/server';
import { deliveryInspectionService } from '@/services/deliveryInspectionService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
    }

    const sessionData = deliveryInspectionService.getSession(trackingNumber);
    const rejectionReasons = deliveryInspectionService.getRejectionReasons();
    const config = deliveryInspectionService.getConfig();

    return NextResponse.json({
      success: true,
      data: {
        ...sessionData,
        rejectionReasons,
        config,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
