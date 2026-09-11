import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storeService } from '@/services/storeService';
import { FreelancerDetailClient } from '@/components/digital-services/FreelancerDetailClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateFreelancerSchema, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo/jsonLd';
import type { FreelancerProfile } from '@/types';

interface FreelancerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FreelancerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await storeService.getStoreById(id);
  const freelancer = data && (data.type as string) === 'freelancer' ? (data as unknown as FreelancerProfile) : null;

  if (!freelancer) {
    return constructMetadata({
      title: 'Freelancer Not Found',
      description: 'The requested freelancer profile was not found on Khidmatik.',
      noIndex: true,
    });
  }

  const title = `${freelancer.name} - ${freelancer.tagline || 'Digital Specialist'} in Algeria`;
  const description =
    freelancer.description ||
    `Hire ${freelancer.name} on Khidmatik Algérie. Verified freelancer offering high quality digital services and solutions.`;

  return constructMetadata({
    title,
    description,
    image: freelancer.images?.[0] || '/images/og-default.png',
    canonicalUrl: `/digital-services/${id}`,
    type: 'profile',
    keywords: [
      freelancer.name,
      freelancer.tagline || 'Freelancer',
      'Algeria Freelance',
      'Khidmatik Digital',
      ...(freelancer.skills || []),
    ],
  });
}

export default async function FreelancerDetailPage({ params }: FreelancerDetailPageProps) {
  const { id } = await params;
  const data = await storeService.getStoreById(id);
  const freelancer = data && (data.type as string) === 'freelancer' ? (data as unknown as FreelancerProfile) : null;

  if (!freelancer) {
    notFound();
  }

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Digital Services / الخدمات الرقمية', url: '/digital-services' },
    { name: freelancer.name, url: `/digital-services/${freelancer.id}` },
  ]);

  const freelancerSchema = generateFreelancerSchema(freelancer);
  const serviceSchema = generateServiceSchema(
    {
      id: freelancer.id,
      name: `${freelancer.name} - ${freelancer.tagline || 'Freelance Services'}`,
      description: freelancer.description,
      category: freelancer.digitalCategorySlug,
      price: freelancer.servicePackages?.[0]?.price || 5000,
    },
    {
      id: freelancer.id,
      name: freelancer.name,
      avatarUrl: freelancer.images?.[0],
      wilaya: freelancer.location?.city,
    }
  );

  return (
    <>
      <JsonLd data={[breadcrumbs, freelancerSchema, serviceSchema]} />
      <FreelancerDetailClient freelancerId={id} initialFreelancer={freelancer} />
    </>
  );
}
