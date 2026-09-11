import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storeService } from '@/services/storeService';
import { seoService } from '@/services/seoService';
import { mockListings } from '@/data/mock';
import { ListingDetailClient } from '@/components/listings/ListingDetailClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateLocalBusinessSchema, generateBreadcrumbSchema, generateProductSchema } from '@/lib/seo/jsonLd';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  let listing = await storeService.getStoreById(id);

  if (!listing) {
    listing = (mockListings.find((l) => l.id === id) as any) || null;
  }

  if (!listing) {
    return constructMetadata({
      title: 'Listing Not Found',
      description: 'The requested store or service provider was not found on Khidmatik.',
      noIndex: true,
    });
  }

  return seoService.getStoreMetadata({
    id: listing.id,
    name: listing.name,
    category: listing.category,
    description: listing.description,
    city: listing.location?.city,
    wilayaCode: listing.location?.wilayaCode,
    bannerImageUrl: listing.bannerImageUrl,
    images: listing.images,
    type: listing.type,
  });
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;
  let listing = await storeService.getStoreById(id);

  if (!listing) {
    listing = (mockListings.find((l) => l.id === id) as any) || null;
  }

  if (!listing) {
    notFound();
  }

  const isStore = listing.type === 'store';
  const categoryName = listing.category;

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: isStore ? 'Stores / المتاجر' : 'Services / الخدمات', url: `/listings?type=${listing.type}` },
    { name: categoryName, url: `/listings?category=${categoryName.toLowerCase()}` },
    { name: listing.name, url: `/listings/${listing.id}` },
  ]);

  const businessSchema = generateLocalBusinessSchema(listing);

  // If store has products, generate individual Product schemas
  const productSchemas =
    isStore && listing.products && listing.products.length > 0
      ? listing.products.slice(0, 5).map((prod) =>
          generateProductSchema(prod, {
            id: listing.id,
            name: listing.name,
            wilaya: listing.location?.city,
          })
        )
      : [];

  return (
    <>
      <JsonLd data={[breadcrumbs, businessSchema, ...productSchemas]} />
      <ListingDetailClient initialListing={listing} />
    </>
  );
}
