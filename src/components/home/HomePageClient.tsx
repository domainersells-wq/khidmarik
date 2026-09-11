'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { AdvancedSearchBar } from '@/components/yelp/AdvancedSearchBar';
import { ListingCard } from '@/components/listings/ListingCard';
import { storeService } from '@/services/storeService';
import { ArrowRight, Sparkles, ListFilter } from 'lucide-react';
import { getIconComponent } from '@/lib/icons';
import type { Store, Listing, Category, BannerItem } from '@/types';
import { useState, useEffect, Suspense } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SuperAppSectorsHub } from '@/components/home/SuperAppSectorsHub';

const HOMEPAGE_BANNERS_STORAGE_KEY = 'khidmatikHomepageBanners';

const defaultAdvertisements: BannerItem[] = [
  {
    id: 'ad1',
    src: '/images/banners/ramadan_offers.png',
    alt: 'Ramadan Special Offers in Algérie',
    dataAiHint: 'ramadan promotion',
  },
  {
    id: 'ad2',
    src: '/images/banners/tech_products.png',
    alt: 'New Tech Arrivals on Khidmatik',
    dataAiHint: 'electronics sale',
  },
  {
    id: 'ad3',
    src: '/images/banners/trusted_services.png',
    alt: 'Discover Local Services on Khidmatik',
    dataAiHint: 'local services',
  },
  {
    id: 'ad4',
    src: '/images/banners/handmade_crafts.png',
    alt: 'Support Local Artisans - Handmade in Algérie',
    dataAiHint: 'handmade crafts algeria',
  },
];

export function HomePageClient() {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [madeInAlgeriaStores, setMadeInAlgeriaStores] = useState<Store[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [advertisements, setAdvertisements] = useState<BannerItem[]>(defaultAdvertisements);
  const { translate } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // Load static or stored banners
  useEffect(() => {
    try {
      const storedBannersJSON = localStorage.getItem(HOMEPAGE_BANNERS_STORAGE_KEY);
      if (storedBannersJSON) {
        const storedBanners: BannerItem[] = JSON.parse(storedBannersJSON);
        if (
          Array.isArray(storedBanners) &&
          storedBanners.length > 0 &&
          storedBanners.every((b) => b.id && b.src && b.alt)
        ) {
          setAdvertisements(
            storedBanners.map((b) => ({
              id: b.id,
              src: b.src,
              alt: b.alt,
              link: b.link,
              dataAiHint: b.dataAiHint || b.alt.toLowerCase().split(' ').slice(0, 2).join(' '),
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading banners from localStorage:', error);
    }
  }, []);

  // Fetch categories and listings from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const cats = await storeService.getCategories();
        setCategoriesList(cats);

        // Fetch stores/listings
        const stores = await storeService.getStores({ limit: 6 });
        setFeaturedListings(stores.slice(0, 3));

        const localStores = stores
          .filter((store): store is Store => store.isMadeInAlgeria === true)
          .slice(0, 3);
        setMadeInAlgeriaStores(localStores);
      } catch (err) {
        console.error('Failed to fetch home page data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Banners slide interval
  useEffect(() => {
    const numAds = advertisements.length;
    if (numAds === 0) return;

    const intervalId = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % numAds);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [advertisements]);

  return (
    <div className="space-y-12">
      {/* Advertisement Carousel Section */}
      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-lg shadow-lg animate-fade-in bg-muted">
        {advertisements.length > 0 ? (
          <>
            <div
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}
            >
              {advertisements.map((ad) => (
                <div key={ad.id} className="w-full h-full flex-shrink-0 relative">
                  <Image
                    src={ad.src}
                    alt={ad.alt}
                    fill
                    className="object-cover"
                    data-ai-hint={ad.dataAiHint}
                    priority={ad.id === advertisements[0].id}
                  />
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {advertisements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAdIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentAdIndex === index
                      ? 'bg-primary scale-125'
                      : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No advertisements to display.
          </div>
        )}
      </section>

      {/* Welcome Text and Search Section */}
      <section className="text-center py-8 md:py-12 animate-slide-up animation-delay-100">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-foreground">
            {translate('welcomeToKhidmatik', 'Welcome to Khidmatik')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {translate(
              'welcomeSubtitle',
              'Your Super-App for Algérie! Discover stores, services, parts, and more.'
            )}
          </p>
          <div className="max-w-3xl mx-auto">
            <Suspense
              fallback={<div className="h-12 bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />}
            >
              <AdvancedSearchBar />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Super App Sectors Hub - The 6 core interconnected pillars */}
      <SuperAppSectorsHub />

      {/* Categories Section */}
      <section className="animate-slide-up animation-delay-200">
        <h2 className="text-3xl font-bold font-headline text-center mb-8">
          {translate('browseByCategory', 'Browse by Category')}
        </h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categoriesList.slice(0, 15).map((category) => {
              const CategoryIcon = getIconComponent(category.icon as unknown as string);
              return (
                <Link
                  key={category.id}
                  href={`/listings?category=${category.slug}&type=${
                    category.type === 'all' ? '' : category.type
                  }`}
                  passHref
                >
                  <Card className="text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col items-center justify-center p-4 rounded-lg border hover:border-primary">
                    <CardHeader className="p-2">
                      <CategoryIcon className="h-10 w-10 text-primary mx-auto mb-2" />
                      <CardTitle className="text-md font-semibold">{category.name}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/listings">
              <ListFilter className="mr-2 h-4 w-4" />{' '}
              {translate('viewAllListings', 'View All Categories & Listings')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="animate-slide-up animation-delay-400">
        <h2 className="text-3xl font-bold font-headline text-center mb-8">
          {translate('featuredListings', 'Featured Listings')}
        </h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading listings...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg">
            <Link href="/listings">
              {translate('viewAllListings', 'View All Listings')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Made in Algérie Section */}
      {!isLoading && madeInAlgeriaStores.length > 0 && (
        <section className="animate-slide-up animation-delay-500">
          <h2 className="text-3xl font-bold font-headline text-center mb-8 flex items-center justify-center">
            <Sparkles className="h-8 w-8 mr-3 text-accent" />{' '}
            {translate('madeInAlgeria', 'Proudly Made in Algérie')}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {madeInAlgeriaStores.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link href="/listings?q=made+in+algerie">
                {translate('exploreAllLocal', 'Explore All Local Products')}{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-12 bg-card rounded-lg shadow animate-slide-up animation-delay-600 border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-headline mb-4">
            {translate('areYouBusinessOwner', 'Are you a Business Owner or Professional?')}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {translate(
              'joinKhidmatikToday',
              'Join Khidmatik today and reach more customers in your area.'
            )}
          </p>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
            <Link href="/register/choice">
              {translate('listYourBusiness', 'List Your Business or Service')}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
