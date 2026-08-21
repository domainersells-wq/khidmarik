import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; partId: string }> }
) {
  try {
    const { orderId, partId } = await params;
    const body = await request.json();
    const { approved, rejectionReason } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'INVALID_INPUT', message: 'Field "approved" (boolean) is required.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      partId,
      status: approved ? 'approved' : 'rejected',
      rejectionReason: approved ? undefined : (rejectionReason || 'Rejected by customer'),
      message: approved 
        ? 'Spare part purchase approved. Invoice total updated and craftsman notified to proceed.'
        : 'Spare part purchase rejected by customer.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
