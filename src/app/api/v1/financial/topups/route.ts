import { NextRequest, NextResponse } from 'next/server';
import {
  getServerTopUps,
  addServerTopUp,
  isServerPostalCodeUsed,
  readServerTopUps
} from '@/infrastructure/storage/serverFinancialStore';
import { notificationService } from '@/services/notificationService';
import { TopUpStatus, TopUpMethod, TopUpRequest } from '@/types/financials';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TopUpStatus | null;
    const userId = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;

    const allRequests = readServerTopUps();
    const list = getServerTopUps({
      status: status || undefined,
      userId,
      search,
    });

    const metrics = {
      totalCount: allRequests.length,
      pendingCount: allRequests.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_VERIFICATION').length,
      approvedCount: allRequests.filter(r => r.status === 'APPROVED' || r.status === 'CREDITED').length,
      rejectedCount: allRequests.filter(r => r.status === 'REJECTED' || r.status === 'INFO_REQUIRED').length,
      totalApprovedVolume: allRequests
        .filter(r => r.status === 'APPROVED' || r.status === 'CREDITED')
        .reduce((sum, r) => sum + r.amount, 0),
    };

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch top-up requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      accountType,
      walletId,
      amount,
      paymentMethod,
      postalTransactionCode,
      senderName,
      senderAccount,
      transferDate,
      userNotes,
      receiptUrl
    } = body;

    const numAmount = parseFloat(amount);
    if (!userId || !numAmount || numAmount < 500) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم ومبلغ شحن لا يقل عن 500 دج مطلوب' },
        { status: 400 }
      );
    }

    const cleanCode = postalTransactionCode ? String(postalTransactionCode).trim() : '';
    if (!cleanCode) {
      return NextResponse.json(
        { success: false, error: 'رمز العملية البريدية أو وصل التحويل مطلوب' },
        { status: 400 }
      );
    }

    if (isServerPostalCodeUsed(cleanCode)) {
      return NextResponse.json(
        { success: false, error: 'رمز العملية البريدية هذا مسجل بالفعل في طلب شحن آخر' },
        { status: 400 }
      );
    }

    const all = readServerTopUps();
    const count = all.length + 1;
    const padCount = String(count).padStart(6, '0');
    const publicRequestNumber = `TOP-2026-${padCount}`;
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiresDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const expiresStr = expiresDate.toISOString().replace('T', ' ').substring(0, 19);

    const newRequest: TopUpRequest = {
      id: body.id || `topup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      publicRequestNumber: body.publicRequestNumber || publicRequestNumber,
      userId,
      userName: userName || 'Client',
      userEmail: userEmail || '',
      userPhone: userPhone || '',
      accountType: accountType || 'client',
      walletId: walletId || `wallet_${userId}`,
      amount: numAmount,
      currency: 'DZD',
      paymentMethod: (paymentMethod as TopUpMethod) || 'baridimob',
      status: 'UNDER_REVIEW',
      createdAt: nowStr,
      submittedAt: nowStr,
      expiresAt: expiresStr,
      platformAccountName: 'KHIDMATIK / منصة خدماتك الجزائر',
      platformCcpNumber: '0022334455 88',
      platformRipNumber: '00799999002233445588',
      postalTransactionCode: cleanCode,
      paymentReference: cleanCode,
      senderName: senderName || userName || 'Client',
      senderAccount: senderAccount || '',
      transferDate: transferDate || nowStr.split(' ')[0],
      receiptUrl: receiptUrl || '',
      userNotes: userNotes || '',
    };

    addServerTopUp(newRequest);

    // Send admin notification
    try {
      await notificationService.sendNotification({
        userId: 'admin',
        type: 'topup_request',
        title: `🔔 طلب شحن رصيد جديد: ${newRequest.publicRequestNumber}`,
        message: `أرسل ${newRequest.userName} إثبات تحويل بمبلغ ${newRequest.amount.toLocaleString()} دج عبر ${newRequest.paymentMethod.toUpperCase()}. كود العملية البريدية: ${cleanCode}`,
        data: {
          referenceId: newRequest.publicRequestNumber,
          requestId: newRequest.id,
          amount: newRequest.amount,
          senderName: newRequest.senderName,
          postalCode: cleanCode,
          paymentMethod: newRequest.paymentMethod,
          actionUrl: `/admin/dashboard?section=topup-management&requestId=${newRequest.publicRequestNumber}`,
        },
        channel: 'all',
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch admin notification in API route:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Top-up request submitted successfully and stored on server',
      data: newRequest,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create top-up request' },
      { status: 500 }
    );
  }
}

