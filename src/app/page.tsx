import type { Metadata } from 'next';
import { HomePageClient } from '@/components/home/HomePageClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Khidmatik - Super App for Algeria | خدماتك المنصة الشاملة للخدمات في الجزائر',
  description:
    'Khidmatik (خدماتك) connects you with top-rated local stores, certified craftsmen (plumbing, electrical, AC), auto spare parts, freelance digital experts, and event venues across all 58 Wilayas in Algeria.',
  canonicalUrl: '/',
});

export default function HomePage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <HomePageClient />
    </>
  );
}