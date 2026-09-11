import { NextRequest, NextResponse } from 'next/server';
import { updateServerTopUp, getServerTopUpById } from '@/infrastructure/storage/serverFinancialStore';
import { notificationService } from '@/services/notificationService';
import { TopUpRejectionReason } from '@/types/financials';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminName, reason, adminNotes } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'سبب الرفض مطلوب' },
        { status: 400 }
      );
    }

    const existing = getServerTopUpById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'طلب الشحن غير موجود' },
        { status: 404 }
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated = updateServerTopUp(id, {
      status: 'REJECTED',
      reviewedBy: adminName || 'Admin Supervisor',
      reviewedAt: nowStr,
      rejectionReason: reason as TopUpRejectionReason,
      adminNotes: adminNotes || 'تعذر مطابقة كود العملية مع الكشوفات البريدية',
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
        type: 'topup_rejected',
        title: '❌ تعذر اعتماد طلب شحن الرصيد',
        message: `تم رفض طلب الشحن رقم ${updated.publicRequestNumber}. السبب: ${adminNotes || 'لم يتم العثور على العملية في كشف الحساب أو الكود غير صحيح'}.`,
        data: {
          referenceId: updated.publicRequestNumber,
          requestId: updated.id,
          rejectionReason: reason,
          actionUrl: '/profile?tab=wallet',
        },
        channel: 'all',
      });
    } catch (e) {
      console.warn('Failed to send notification in reject API route:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Top-up request rejected and stored on server',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject top-up request' },
      { status: 500 }
    );
  }
}

