import React from 'react';
import type { Metadata } from 'next';
import { EcommerceMasterContainer } from '@/components/ecommerce/EcommerceMasterContainer';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Khidmatik Express Store - Direct E-Commerce & Fast Delivery | متجر خدماتك السريع',
  description:
    'Verified multi-category Algerian e-commerce store with AI visual search, grouped Yalidine express shipping, SKU variant catalog, and Escrow buyer protection.',
  canonicalUrl: '/store-express',
  keywords: [
    'boutique en ligne algerie',
    'achat en ligne alger',
    'yalidine express delivery',
    'shopping algerie',
    'متجر الكتروني الجزائر',
  ],
});

export default function StoreExpressPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Store Express / متجر خدماتك السريع', url: '/store-express' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6">
      <JsonLd data={breadcrumbs} />
      <EcommerceMasterContainer />
    </div>
  );
}
