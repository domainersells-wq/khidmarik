'use client';

import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast';
import { FintechNotificationCard, NotificationCardVariant } from '@/components/ui/FintechNotificationCard';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const resolveCardVariant = (
    explicitCardVariant?: string | null,
    standardVariant?: string | null,
    title?: any,
    description?: any
  ): NotificationCardVariant => {
    if (explicitCardVariant) {
      return explicitCardVariant as NotificationCardVariant;
    }
    if (standardVariant === 'destructive') {
      return 'destructive';
    }

    const textToScan = `${typeof title === 'string' ? title : ''} ${
      typeof description === 'string' ? description : ''
    }`;

    // 1. Balance / Wallet / Top-up
    if (
      textToScan.includes('الرصيد') ||
      textToScan.includes('محفظتك') ||
      textToScan.includes('💳') ||
      textToScan.includes('شحن') ||
      textToScan.includes('تحويل')
    ) {
      if (textToScan.includes('فشل') || textToScan.includes('تعذر') || textToScan.includes('رفض')) {
        return 'destructive';
      }
      return 'balance';
    }

    // 2. Destructive / Error
    if (
      textToScan.includes('خطأ') ||
      textToScan.includes('فشل') ||
      textToScan.includes('تعذر') ||
      textToScan.includes('ملغى')
    ) {
      return 'destructive';
    }

    // 3. Warning / Info Required
    if (
      textToScan.includes('تحذير') ||
      textToScan.includes('نقص') ||
      textToScan.includes('تنبيه') ||
      textToScan.includes('يرجى إعادة إرسال') ||
      textToScan.includes('مراجعة')
    ) {
      return 'warning';
    }

    // 4. Info
    if (
      textToScan.includes('رسالة') ||
      textToScan.includes('معلومة') ||
      textToScan.includes('تحديث حالة') ||
      textToScan.includes('إشعار')
    ) {
      return 'info';
    }

    // 5. Success
    if (
      textToScan.includes('نجاح') ||
      textToScan.includes('تم') ||
      textToScan.includes('اعتماد') ||
      textToScan.includes('مكتمل') ||
      textToScan.includes('✅')
    ) {
      return 'success';
    }

    return 'default' as NotificationCardVariant;
  };

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        amount,
        timestampText,
        cardVariant,
        variant,
        ...props
      }) {
        const resolvedVariant = resolveCardVariant(cardVariant, variant, title, description);

        return (
          <Toast
            key={id}
            variant={variant}
            className="w-full max-w-[440px] border-0 p-0 bg-transparent shadow-none"
            {...props}
          >
            <FintechNotificationCard
              id={id}
              variant={resolvedVariant}
              title={title}
              description={description}
              amount={amount}
              timestampText={timestampText || 'الآن'}
              onClose={() => dismiss(id)}
            />
            {action && <div className="mt-2">{action}</div>}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
