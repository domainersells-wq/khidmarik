import type { Metadata } from 'next';
import { MarketplaceClient } from '@/components/marketplace/MarketplaceClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Marketplace - Buy & Sell Auto, Home & Appliance Parts | سوق قطع الغيار في الجزائر',
  description:
    'Algeria’s specialized marketplace for new and used auto spare parts, home appliance components, electronics, hardware, and tools across all 58 Wilayas.',
  canonicalUrl: '/marketplace',
  keywords: [
    'marketplace algerie',
    'قطع غيار الجزائر',
    'pièces détachées algerie',
    'auto parts algeria',
    'used parts algeria',
    'khidmatik marketplace',
  ],
});

export default function MarketplacePage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Marketplace / سوق قطع الغيار', url: '/marketplace' },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <MarketplaceClient />
    </>
  );
}
