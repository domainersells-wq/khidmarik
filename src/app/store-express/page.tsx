import React from 'react';
import { EcommerceMasterContainer } from '@/components/ecommerce/EcommerceMasterContainer';

export const metadata = {
  title: 'التسوق والتجارة المعتمدة (Khidmatik Express Store) | منصة خدماتك',
  description: 'محرك المتغيرات المتقدم (SKU Variations)، البحث البصري بالذكاء الاصطناعي، شحن ياليدين المجمّع، ونظام الضمان المالي وحماية المشتري (Escrow).'
};

export default function StoreExpressPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
      <EcommerceMasterContainer />
    </div>
  );
}
