import type { Metadata } from 'next';
import { PartsMineClient } from '@/components/parts/PartsMineClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'The Parts Mine - Specialized Auto & Appliance Spare Parts Hub | منجم قطع الغيار',
  description:
    'Browse thousands of authentic new and used spare parts for vehicles, home appliances, electrical devices, and hardware tools across all Algerian Wilayas.',
  canonicalUrl: '/parts-mine',
  keywords: [
    'parts mine algerie',
    'منجم قطع الغيار',
    'pieces auto algerie',
    'pieces electromenager alger',
  ],
});

export default function PartsMinePage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Parts Mine / منجم قطع الغيار', url: '/parts-mine' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <PartsMineClient />
    </>
  );
}
