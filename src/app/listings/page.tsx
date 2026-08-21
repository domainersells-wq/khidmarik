import { Suspense } from 'react';
import { storeService } from '@/services/storeService';
import type { Listing, Professional } from '@/types';
import type { Metadata } from 'next';
import { ListingsClientContainer } from '@/components/yelp/ListingsClientContainer';

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    neighborhood?: string;
    type?: 'store' | 'professional' | '';
    capacity?: string;
    price?: string;
    date?: string;
  }>;
}

export async function generateMetadata({ searchParams: searchParamsPromise }: ListingsPageProps): Promise<Metadata> {
  const searchParams = await searchParamsPromise;
  const { q, category, location, type } = searchParams;
  let title = 'Browse Listings';
  if (type === 'store') title = 'Browse Stores';
  if (type === 'professional') title = 'Browse Professionals';
  
  if (category) {
    const catDetails = await storeService.getCategoryBySlug(category);
    if (catDetails) title = `Browse ${catDetails.name}`;
  }
  if (q) title = `Search results for "${q}"`;
  if (location) title = `${title} in ${location}`;

  return {
    title: `${title} | Khidmatik`,
    description: `Find local stores and professionals on Khidmatik. Search by keyword, category, and location. ${type ? `Showing ${type}s.` : ''}`,
  };
}

export default async function ListingsPage({ searchParams: searchParamsPromise }: ListingsPageProps) {
  const searchParams = await searchParamsPromise;
  const { q, category, location, neighborhood, type, capacity, price, date } = searchParams;

  // Retrieve listings from Supabase storeService
  let filteredListings: Listing[] = await storeService.getStores({
    categorySlug: category,
    searchQuery: q,
    wilayaCode: location,
  });

  // Filter by type on returned listings if query didn't restrict fully
  if (type) {
    filteredListings = filteredListings.filter(listing => listing.type === type);
  }

  if (capacity) {
    const minCapacity = parseInt(capacity, 10);
    if (!isNaN(minCapacity)) {
      filteredListings = filteredListings.filter((listing) => {
        if ('capacity' in listing && typeof (listing as any).capacity === 'number') {
          return (listing as any).capacity >= minCapacity;
        }
        if (listing.type === 'professional' && 'appointmentConfig' in listing && listing.appointmentConfig) {
          return listing.appointmentConfig.dailyCapacity >= minCapacity;
        }
        return true;
      });
    }
  }

  if (price) {
    const maxPrice = parseFloat(price);
    if (!isNaN(maxPrice)) {
      filteredListings = filteredListings.filter((listing) => {
        if ('price' in listing && typeof (listing as any).price === 'number') {
          return (listing as any).price <= maxPrice;
        }
        if (listing.type === 'store' && 'products' in listing && listing.products) {
          return listing.products.some((product) => 
            product.variants?.some((v) => v.price <= maxPrice)
          );
        }
        if (listing.servicePrice) {
          return listing.servicePrice <= maxPrice;
        }
        return true;
      });
    }
  }

  if (date) {
    filteredListings = filteredListings.filter((listing) => {
      if (listing.type === 'professional') {
        return (listing as Professional).supportsAppointments !== false;
      }
      return true;
    });
  }

  // Prioritize neighborhood professionals if location (zip) is specified
  const userSearchZip = location ? location.toLowerCase() : undefined;
  if (userSearchZip && (type === 'professional' || !type)) {
    filteredListings.sort((a, b) => {
      const aIsNeighborhoodPro = a.type === 'professional' && (a as Professional).location.zipCode?.toLowerCase() === userSearchZip;
      const bIsNeighborhoodPro = b.type === 'professional' && (b as Professional).location.zipCode?.toLowerCase() === userSearchZip;

      if (aIsNeighborhoodPro && !bIsNeighborhoodPro) return -1;
      if (!aIsNeighborhoodPro && bIsNeighborhoodPro) return 1;
      return 0;
    });
  }

  const getHeader = () => {
    if (type === 'store') {
      return {
        title: q ? `Search Stores for "${q}"` : category ? `Explore Stores` : `Explore Local Stores`,
        desc: `Discover, shop, and review top-rated local stores and retail shops near you.`
      };
    }
    if (type === 'professional') {
      return {
        title: q ? `Search Services for "${q}"` : category ? `Explore Local Services` : `Explore Professional Services`,
        desc: `Discover, book, and review top-rated local professional service providers and technicians near you.`
      };
    }
    return {
      title: q ? `Search Results for "${q}"` : category ? `Explore Local Services` : `Explore Khidmatik Local`,
      desc: `Discover, book, and review top-rated stores and professional service providers near you.`
    };
  };

  const headerInfo = getHeader();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-headline font-bold mb-1">
          {headerInfo.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {headerInfo.desc}
        </p>
      </header>

      <Suspense fallback={<div className="text-center py-12">Loading local search engine...</div>}>
        <ListingsClientContainer 
          initialListings={filteredListings} 
          initialParams={{ q, category, location, neighborhood, type }} 
        />
      </Suspense>
    </div>
  );
}
