import { TopUpStatus } from '@/types/financials';

export interface TopUpStatusMeta {
  code: TopUpStatus;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  iconName: 'Clock' | 'CheckCircle' | 'AlertCircle' | 'HelpCircle' | 'XCircle' | 'Zap';
  descriptionAr: string;
  descriptionEn: string;
}

export function normalizeTopUpStatus(rawStatus?: string | null): TopUpStatus {
  if (!rawStatus) return 'PENDING_VERIFICATION';
  const clean = rawStatus.toUpperCase().trim();
  if (clean === 'UNDER_REVIEW' || clean === 'PENDING_REVIEW' || clean === 'PENDING' || clean === 'PENDING-REVIEW') {
    return 'PENDING_VERIFICATION';
  }
  if (clean === 'APPROVED' || clean === 'CREDITED' || clean === 'COMPLETED') {
    return 'APPROVED';
  }
  if (clean === 'REJECTED' || clean === 'DECLINED') {
    return 'REJECTED';
  }
  if (clean === 'INFO_REQUIRED' || clean === 'NEED_INFO') {
    return 'INFO_REQUIRED';
  }
  if (clean === 'VERIFYING') {
    return 'VERIFYING';
  }
  if (clean === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (clean === 'EXPIRED') {
    return 'EXPIRED';
  }
  if (clean === 'DRAFT') {
    return 'DRAFT';
  }
  return 'PENDING_VERIFICATION';
}

export function getTopUpStatusMeta(status: TopUpStatus | string): TopUpStatusMeta {
  const norm = normalizeTopUpStatus(status);

  switch (norm) {
    case 'APPROVED':
    case 'CREDITED':
      return {
        code: 'APPROVED',
        labelAr: 'معتمد ومضاف للرصيد',
        labelEn: 'Approved & Credited',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        iconName: 'CheckCircle',
        descriptionAr: 'تمت مطابقة الحوالة وإيداع الرصيد بنجاح في المحفظة.',
        descriptionEn: 'Payment verified and funds successfully credited to wallet.',
      };
    case 'VERIFYING':
      return {
        code: 'VERIFYING',
        labelAr: 'جارٍ التحقق الآلي...',
        labelEn: 'Verifying Gateway...',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        iconName: 'Zap',
        descriptionAr: 'يقوم محرك المطابقة بفحص كود العملية مع البنك أو بريد الجزائر.',
        descriptionEn: 'Checking transaction code with payment gateway.',
      };
    case 'INFO_REQUIRED':
      return {
        code: 'INFO_REQUIRED',
        labelAr: 'مطلوب توضيح إضافي',
        labelEn: 'Clarification Needed',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        iconName: 'HelpCircle',
        descriptionAr: 'يرجى تقديم وصل أوضح أو رقم عملية إضافي لإتمام المطابقة.',
        descriptionEn: 'Please submit a clearer receipt or transaction reference.',
      };
    case 'REJECTED':
      return {
        code: 'REJECTED',
        labelAr: 'مرفوض من الإدارة',
        labelEn: 'Rejected',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        iconName: 'XCircle',
        descriptionAr: 'تعذر اعتماد الحوالة لعدم مطابقة بيانات الوصل أو انتهاء الصلاحية.',
        descriptionEn: 'Payment verification rejected due to reference mismatch.',
      };
    case 'CANCELLED':
      return {
        code: 'CANCELLED',
        labelAr: 'ملغي',
        labelEn: 'Cancelled',
        badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        iconName: 'AlertCircle',
        descriptionAr: 'تم إلغاء طلب الشحن من قبل المستخدم.',
        descriptionEn: 'Top-up request was cancelled by the user.',
      };
    case 'PENDING_PAYMENT_CONFIRMATION':
      return {
        code: 'PENDING_PAYMENT_CONFIRMATION',
        labelAr: 'بانتظار إدخال وصل التحويل',
        labelEn: 'Awaiting Receipt',
        badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        iconName: 'Clock',
        descriptionAr: 'تم إنشاء الطلب، يرجى إدخال رقم العملية بعد إتمام التحويل.',
        descriptionEn: 'Request initiated, please enter postal transfer code.',
      };
    case 'PENDING_VERIFICATION':
    case 'UNDER_REVIEW':
    default:
      return {
        code: 'PENDING_VERIFICATION',
        labelAr: 'قيد التدقيق والمراجعة',
        labelEn: 'Pending Verification',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
        iconName: 'Clock',
        descriptionAr: 'الطلب قيد المراجعة والمطابقة المالية من قبل إدارة منصة خدماتك.',
        descriptionEn: 'Top-up is under review and ledger reconciliation by finance desk.',
      };
  }
}
