import { NextRequest, NextResponse } from 'next/server';
import { deliveryInspectionService } from '@/services/deliveryInspectionService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const body = await request.json().catch(() => ({}));

    const deliveryAgentId = body.deliveryAgentId || body.agent_id || 'drv_default';
    const deliveryCompanyId = body.deliveryCompanyId || body.provider_id;

    const result = await deliveryInspectionService.startInspectionSession({
      trackingNumber,
      deliveryAgentId,
      deliveryCompanyId,
    });

    return NextResponse.json({
      success: true,
      data: result.session,
      alreadyActive: result.alreadyActive || false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start inspection' }, { status: 400 });
  }
}
