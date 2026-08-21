import { NextRequest, NextResponse } from 'next/server';

interface SparePart {
  id: string;
  orderId: string;
  name: string;
  priceDA: number;
  quantity: number;
  receiptPhotoUrl: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  addedAt: string;
}

const mockPartsStore: Record<string, SparePart[]> = {
  'SOS-2026-8941': [
    {
      id: 'PART-001',
      orderId: 'SOS-2026-8941',
      name: 'صمام أمان نحاسي أصلي (3/4 Brass Valve)',
      priceDA: 1800,
      quantity: 1,
      receiptPhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60',
      status: 'approved',
      addedAt: '14:25'
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const parts = mockPartsStore[orderId] || [];
  return NextResponse.json({ success: true, orderId, parts });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { name, priceDA, quantity, receiptPhotoUrl } = body;

    if (!name || !priceDA || !receiptPhotoUrl) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Part name, priceDA, and receiptPhotoUrl are required.' },
        { status: 400 }
      );
    }

    const newPart: SparePart = {
      id: `PART-${Date.now().toString().slice(-6)}`,
      orderId,
      name,
      priceDA: Number(priceDA),
      quantity: Number(quantity) || 1,
      receiptPhotoUrl,
      status: 'pending_approval',
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!mockPartsStore[orderId]) {
      mockPartsStore[orderId] = [];
    }
    mockPartsStore[orderId].push(newPart);

    return NextResponse.json({
      success: true,
      orderId,
      part: newPart,
      message: 'Spare part created. Real-time push notification dispatched to customer for 1-tap approval.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
