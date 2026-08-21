import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category = 'plumbing_leak', radiusKm = 8, surgeFeeDA = 1500, customer } = body;

    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const orderId = `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const responseOrder = {
      id: orderId,
      category,
      isEmergency: true,
      emergencyRadiusKm: radiusKm,
      status: 'REQUESTED',
      quotation: {
        laborType: 'fixed_quote',
        laborCostDA: 3500,
        emergencySurgeFeeDA: surgeFeeDA,
        spareParts: [],
        platformCommissionRate: 0.05,
        netTotalDA: 3500 + surgeFeeDA
      },
      otpSecurity: {
        startOtp,
        completionOtp
      },
      customer: customer || {
        name: 'كريم بلقاسم (Karim B.)',
        phone: '0550 12 34 56',
        wilaya: 'الجزائر العاصمة (Alger)',
        address: 'حي 150 مسكن، دالي إبراهيم'
      },
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      order: responseOrder,
      message: `Emergency SOS order ${orderId} broadcasted to all active verified craftsmen in ${radiusKm}km radius.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'SERVER_ERROR', message: err?.message }, { status: 500 });
  }
}
