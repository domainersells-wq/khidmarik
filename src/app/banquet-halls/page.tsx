import type { Metadata } from 'next';
import { BanquetHallsClient } from '@/components/banquet-halls/BanquetHallsClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Banquet Halls & Wedding Venues in Algeria | حجز قاعات الحفلات والأعراس في الجزائر',
  description:
    'Discover and reserve the finest wedding halls, banquet venues, conference rooms, and reception spaces across Algeria. View capacities, amenities, 360° panoramas, and real-time availability.',
  canonicalUrl: '/banquet-halls',
  keywords: [
    'salle des fetes algerie',
    'قاعات حفلات الجزائر',
    'wedding halls algeria',
    'banquet halls alger',
    'salle des fetes oran',
  ],
});

export default function BanquetHallsPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Banquet Halls / قاعات الحفلات', url: '/banquet-halls' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <BanquetHallsClient />
    </>
  );
}