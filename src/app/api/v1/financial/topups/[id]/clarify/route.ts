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
    const { clarificationText, attachmentUrl, fileName, newPostalTransactionCode } = body;

    if (!newPostalTransactionCode?.trim() && (!clarificationText || !clarificationText.trim()) && !attachmentUrl) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال رقم العملية البريدية أو كتابة توضيح أو إرفاق وصل التحويل للرد' },
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
    const cleanCode = newPostalTransactionCode?.trim();
    const updated = updateServerTopUp(id, {
      status: 'UNDER_REVIEW', // Reset to under review for admin attention
      postalTransactionCode: cleanCode || existing.postalTransactionCode,
      paymentReference: cleanCode || existing.paymentReference,
      userResubmittedPostalCode: cleanCode || existing.userResubmittedPostalCode,
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
        title: `📎 إعادة إرسال رقم العملية والمستند: ${updated.publicRequestNumber}`,
        message: `أعاد ${updated.userName} إرسال رقم العملية البريدية (${updated.postalTransactionCode || 'مستند مرفق'}) لطلب الشحن (${updated.amount.toLocaleString()} دج). اضغط للتدقيق والمطابقة.`,
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
