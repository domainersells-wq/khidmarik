import React from 'react';
import { CraftsmenDispatchContainer } from '@/components/craftsmen/CraftsmenDispatchContainer';

export const metadata = {
  title: 'منظومة الحرفيين والخدمات الطارئة (SOS Craftsmen) | منصة خدماتك',
  description: 'منظومة متقدمة لطلب وتوجيه الحرفيين والتدخلات الطارئة مع تسعير شفاف لقطع الغيار وتوثيق بصري إلزامي وتحقق أمني مزدوج (Dual-OTP).'
};

export default function CraftsmenDispatchPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <CraftsmenDispatchContainer />
    </main>
  );
}
