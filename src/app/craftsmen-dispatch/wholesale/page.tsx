import React from 'react';
import type { Metadata } from 'next';
import { WholesaleB2BMarket } from '@/components/craftsmen/WholesaleB2BMarket';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Craftsmen Wholesale & Hardware B2B (سوق الجملة للخردوات) | خدماتك الجزائر',
  description:
    'Dedicated B2B hardware & spare parts wholesale channel for certified craftsmen and technicians across Algeria with on-site fast delivery.',
  canonicalUrl: '/craftsmen-dispatch/wholesale',
  keywords: [
    'quincaillerie gros algerie',
    'grossiste plomberie algerie',
    'pieces clim gros',
    'سوق جملة خردوات الجزائر',
    'توريد ورشات الحرفيين',
  ],
});

export default function CraftsmenWholesalePage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Craftsmen SOS / طوارئ الحرفيين', url: '/craftsmen-dispatch' },
    { name: 'Wholesale B2B / سوق الجملة للخردوات', url: '/craftsmen-dispatch/wholesale' },
  ]);

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <JsonLd data={breadcrumbs} />
      <WholesaleB2BMarket />
    </main>
  );
}
