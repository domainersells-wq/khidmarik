import { NextRequest, NextResponse } from 'next/server';
import { updateServerTopUp, getServerTopUpById } from '@/infrastructure/storage/serverFinancialStore';
import { notificationService } from '@/services/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminName, infoNote } = body;

    if (!infoNote || !infoNote.trim()) {
      return NextResponse.json(
        { success: false, error: 'نص التوضيح أو المستند المطلوب إلزامي' },
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
      status: 'INFO_REQUIRED',
      reviewedBy: adminName || 'Admin Supervisor',
      reviewedAt: nowStr,
      requestedInfoNote: infoNote.trim(),
      requestedInfoAt: nowStr,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'فشل في حفظ طلب التوضيح على الخادم' },
        { status: 500 }
      );
    }

    // Send actionable notification to user
    try {
      await notificationService.sendNotification({
        userId: updated.userId,
        type: 'topup_info_required',
        title: `ℹ️ مطلوب توضيح أو إرفاق مستند (${updated.publicRequestNumber})`,
        message: `طلبت الإدارة توضيحاً أو مستنداً إضافياً: "${infoNote.trim()}". يرجى الضغط للرد وإرفاق المستند.`,
        data: {
          referenceId: updated.publicRequestNumber,
          requestId: updated.id,
          requestedInfoNote: infoNote.trim(),
          actionUrl: `/profile?tab=wallet&action=clarify&requestId=${updated.publicRequestNumber}`,
        },
        channel: 'all',
      });
    } catch (notifErr) {
      console.warn('Failed to send notification to user in request-info route:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب التوضيح والمستند للمستخدم بنجاح',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to request more info' },
      { status: 500 }
    );
  }
}

