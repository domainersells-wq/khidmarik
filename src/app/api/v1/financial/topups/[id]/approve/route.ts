import { NextRequest, NextResponse } from 'next/server';
import { updateServerTopUp, getServerTopUpById, getServerWallet } from '@/infrastructure/storage/serverFinancialStore';
import { notificationService } from '@/services/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { adminName, adminNotes } = body;

    const existing = getServerTopUpById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'طلب الشحن غير موجود' },
        { status: 404 }
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = updateServerTopUp(id, {
      status: 'APPROVED',
      reviewedBy: adminName || 'Admin Supervisor',
      reviewedAt: nowStr,
      adminNotes: adminNotes || 'تم التحقق من الحوالة البريدية واعتماد الشحن بنجاح',
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث حالة طلب الشحن' },
        { status: 500 }
      );
    }

    // Send user notification
    try {
      await notificationService.sendNotification({
        userId: updated.userId,
        type: 'topup_approved',
        title: '✅ تم اعتماد شحن رصيدك بنجاح',
        message: `تم التحقق من الحوالة وإيداع مبلغ ${updated.amount.toLocaleString()} دج في محفظتك الإلكترونية بنجاح.`,
        data: {
          referenceId: updated.publicRequestNumber,
          requestId: updated.id,
          amount: updated.amount,
          actionUrl: '/profile?tab=wallet',
        },
        channel: 'all',
      });
    } catch (e) {
      console.warn('Failed to send notification in approve API route:', e);
    }

    const serverWallet = getServerWallet(updated.userId);

    return NextResponse.json({
      success: true,
      message: 'Top-up request approved and wallet credited successfully',
      data: updated,
      wallet: serverWallet,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve top-up request' },
      { status: 500 }
    );
  }
}

