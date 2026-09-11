import type { Metadata } from 'next';
import { ServicePointClient } from '@/components/service-point/ServicePointClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema, generateLocalBusinessSchema } from '@/lib/seo/jsonLd';

export const metadata: Metadata = constructMetadata({
  title: 'Khidmatik Service Point - Physical Support Hubs in Algeria | مراكز خدماتك الميدانية',
  description:
    'Visit Khidmatik physical service points for face-to-face assistance, craftsman onboarding, warranty verification, and device repair drop-offs in Algiers and across Algeria.',
  canonicalUrl: '/service-point',
  keywords: [
    'point de service algerie',
    'service client khidmatik',
    'centres de reparation alger',
    'مراكز خدمة الزبائن الجزائر',
  ],
});

export default function ServicePointPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Service Point / مراكز الخدمة', url: '/service-point' },
  ]);

  const servicePointSchema = generateLocalBusinessSchema({
    id: 'khidmatik-central-hub',
    name: 'Khidmatik Central Service Point Alger',
    type: 'store',
    category: 'Customer Support & Repair Hub',
    description: 'Official physical support center for Khidmatik users, stores, and craftsmen.',
    location: {
      fullAddress: '123 Rue Didouche Mourad',
      city: 'Alger Centre',
      wilayaCode: '16',
      zipCode: '16000',
    },
    contact: {
      phone: '+213 21 00 00 00',
      email: 'servicepoint@khidmatik.dz',
    },
    operatingHours: 'Sa-Th 08:30-18:00',
  });

  return (
    <>
      <JsonLd data={[breadcrumbs, servicePointSchema]} />
      <ServicePointClient />
    </>
  );
}
