import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DigitalServicesClient } from '@/components/digital-services/DigitalServicesClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

interface DigitalServicesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export async function generateMetadata({ searchParams: searchParamsPromise }: DigitalServicesPageProps): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const { q, category } = searchParams;

  let title = 'Freelance & Digital Services in Algeria | الخدمات الرقمية والعمل الحر';
  let description = 'Hire certified Algerian freelancers in graphic design, web & mobile development, digital marketing, translations, video editing, and AI services.';

  if (category) {
    title = `${category} Freelancers & Digital Services in Algeria`;
    description = `Find expert ${category} freelancers and agencies in Algeria on Khidmatik.`;
  }

  if (q) {
    title = `Search Freelancers for "${q}"`;
    description = `Find qualified digital freelancers offering "${q}" on Khidmatik Algérie.`;
  }

  const canonicalUrl = category ? `/digital-services?category=${encodeURIComponent(category)}` : '/digital-services';

  return constructMetadata({
    title,
    description,
    canonicalUrl,
    keywords: [
      'freelance algerie',
      'developpeur algerie',
      'graphiste alger',
      'digital marketing algeria',
      'services numeriques algerie',
    ],
  });
}

export default async function DigitalServicesPage({ searchParams: searchParamsPromise }: DigitalServicesPageProps) {
  const searchParams = await searchParamsPromise;
  const { category } = searchParams;

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Digital Services / الخدمات الرقمية', url: '/digital-services' },
    ...(category ? [{ name: category, url: `/digital-services?category=${category}` }] : []),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <Suspense fallback={<div className="text-center py-20 text-muted-foreground animate-pulse">Loading digital services portal...</div>}>
        <DigitalServicesClient />
      </Suspense>
    </>
  );
}
