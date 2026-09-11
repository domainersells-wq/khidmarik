import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HallDetailClient } from '@/components/banquet-halls/HallDetailClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateEventVenueSchema, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

const mockHalls = [
  {
    id: 'hall-1',
    name: 'The Grand Ballroom',
    description: 'A luxurious and spacious hall perfect for grand weddings and corporate events in Algiers. Features high ceilings, crystal chandeliers, and a state-of-the-art sound system.',
    images: ['/placeholder.svg', '/placeholder.svg'],
    floorPlan: '/placeholder.svg',
    location: 'Alger Centre, Alger',
    capacity: 500,
    price: 50000,
    rating: 4.8,
    amenities: ['Wi-Fi', 'Air Conditioning', 'Parking', 'Sound System', 'Projector'],
    contact: { phone: '+213 21 00 00 00', email: 'contact@grandballroom.dz' }
  },
  {
    id: 'hall-2',
    name: 'Crystal Gardens',
    description: 'An elegant and charming wedding venue in Oran with beautiful indoor and outdoor spaces. Ideal for weddings, receptions, and family celebrations.',
    images: ['/placeholder.svg', '/placeholder.svg'],
    floorPlan: '/placeholder.svg',
    location: 'Oran, Algérie',
    capacity: 300,
    price: 35000,
    rating: 4.5,
    amenities: ['Wi-Fi', 'Parking', 'Garden', 'Catering Available'],
    contact: { phone: '+213 41 00 00 00', email: 'info@crystalgardens.dz' }
  },
];

interface HallDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: HallDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const hall = mockHalls.find((h) => h.id === id);

  if (!hall) {
    return constructMetadata({
      title: 'Hall Not Found',
      description: 'The requested banquet hall venue was not found on Khidmatik.',
      noIndex: true,
    });
  }

  return constructMetadata({
    title: `${hall.name} - Banquet & Wedding Hall in ${hall.location}`,
    description: hall.description,
    image: hall.images[0] || '/images/og-default.png',
    canonicalUrl: `/halls/${id}`,
    keywords: [
      hall.name,
      'wedding hall algeria',
      'salle des fetes alger',
      'banquet venue',
      hall.location,
    ],
  });
}

export default async function HallDetailPage({ params }: HallDetailPageProps) {
  const { id } = await params;
  const hall = mockHalls.find((h) => h.id === id);

  if (!hall) {
    notFound();
  }

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Banquet Halls / قاعات الحفلات', url: '/banquet-halls' },
    { name: hall.name, url: `/halls/${hall.id}` },
  ]);

  const venueSchema = generateEventVenueSchema(hall);

  return (
    <>
      <JsonLd data={[breadcrumbs, venueSchema]} />
      <HallDetailClient hall={hall} />
    </>
  );
}
