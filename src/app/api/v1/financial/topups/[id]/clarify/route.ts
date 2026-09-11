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
    const { clarificationText, attachmentUrl, fileName } = body;

    if ((!clarificationText || !clarificationText.trim()) && !attachmentUrl) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة توضيح أو إرفاق ملف مستند للرد' },
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
      status: 'UNDER_REVIEW', // Reset to under review for admin attention
      userClarificationText: clarificationText ? clarificationText.trim() : undefined,
      userClarificationAttachmentUrl: attachmentUrl || undefined,
      userClarificationFileName: fileName || undefined,
      userClarificationSubmittedAt: nowStr,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'فشل في حفظ رد المستخدم على الخادم' },
        { status: 500 }
      );
    }

    // Send actionable notification to Admin Supervisor Desk
    try {
      await notificationService.sendNotification({
        userId: 'admin',
        type: 'topup_request',
        title: `📎 رد ومستند جديد من المستخدم: ${updated.publicRequestNumber}`,
        message: `قدم ${updated.userName} توضيحاً ومستنداً لطلب الشحن (${updated.amount.toLocaleString()} دج). اضغط للتدقيق والمطابقة.`,
        data: {
          referenceId: updated.publicRequestNumber,
          requestId: updated.id,
          amount: updated.amount,
          senderName: updated.userName,
          postalCode: updated.postalTransactionCode,
          actionUrl: `/admin/dashboard?section=topup-management&requestId=${updated.publicRequestNumber}`,
        },
        channel: 'all',
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch admin notification in clarify route:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال التوضيح والمستند للإدارة بنجاح',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit clarification' },
      { status: 500 }
    );
  }
}
