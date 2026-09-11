'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storeService } from '@/services/storeService';
import type { FreelancerProfile, Category } from '@/types';
import { FreelancerCard } from '@/components/digital-services/FreelancerCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Palette, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { getIconComponent } from '@/lib/icons';

const ALL_DIGITAL_CATEGORIES_SENTINEL_VALUE = "_all_digital_";

function DigitalServicesGrid({ freelancers }: { freelancers: FreelancerProfile[] }) {
  const { translate } = useLanguage();
  if (freelancers.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{translate('noFreelancersFound', 'No Digital Service Providers Found')}</h2>
        <p className="text-muted-foreground mb-6">
          {translate('noFreelancersFoundSub', "We couldn't find any freelancers matching your criteria. Try adjusting your search or filters.")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/digital-services">{translate('clearFiltersBtn', 'Clear Filters and Search Again')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {freelancers.map((freelancer) => (
        <FreelancerCard key={freelancer.id} freelancer={freelancer} />
      ))}
    </div>
  );
}

export function DigitalServicesClient() {
  const { translate } = useLanguage();
  const router = useRouter();
  const currentParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [digitalCategories, setDigitalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load categories and freelancers from DB
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const cats = await storeService.getCategories();
        const digCats = cats.filter(
          (c) =>
            (c.type as string) === 'freelancer' ||
            c.slug.includes('design') ||
            c.slug.includes('development') ||
            c.slug.includes('marketing') ||
            c.slug.includes('writing')
        );
        setDigitalCategories(digCats);

        const list = await storeService.getStores({
          type: 'freelancer',
        });
        setFreelancers(list as unknown as FreelancerProfile[]);
      } catch (err) {
        console.error('Error fetching digital services:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  let filteredFreelancers = freelancers;

  if (searchTerm) {
    const termLower = searchTerm.toLowerCase();
    filteredFreelancers = filteredFreelancers.filter(
      (f) =>
        f.name.toLowerCase().includes(termLower) ||
        f.tagline?.toLowerCase().includes(termLower) ||
        f.description?.toLowerCase().includes(termLower) ||
        f.skills?.some((skill) => skill.toLowerCase().includes(termLower))
    );
  }

  if (selectedCategorySlug) {
    filteredFreelancers = filteredFreelancers.filter(
      (f) => f.digitalCategorySlug === selectedCategorySlug
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(currentParams?.toString() || '');
    if (searchTerm) params.set('q', searchTerm);
    else params.delete('q');
    if (selectedCategorySlug) params.set('category', selectedCategorySlug);
    else params.delete('category');
    router.push(`/digital-services?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    if (value === ALL_DIGITAL_CATEGORIES_SENTINEL_VALUE) {
      setSelectedCategorySlug('');
    } else {
      setSelectedCategorySlug(value);
    }
  };

  const currentCategoryDetails = selectedCategorySlug
    ? digitalCategories.find((c) => c.slug === selectedCategorySlug)
    : null;
  const pageTitle = currentCategoryDetails
    ? `${translate('digitalServicesTitle', 'Digital Services')}: ${currentCategoryDetails.name}`
    : translate('exploreDigitalServices', 'Explore Digital Services');

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2 flex items-center">
          <Palette className="mr-3 h-8 w-8 text-primary" /> {pageTitle}
        </h1>
        <p className="text-lg text-muted-foreground">
          {translate('findFreelancersSub', 'Find local freelancers and digital service providers in Algérie.')}
        </p>
      </header>

      <form
        onSubmit={handleSearchSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mb-8 bg-card rounded-lg shadow-md border"
      >
        <Input
          type="text"
          placeholder={translate('searchFreelancerPlaceholder', 'Search by name, skill, service...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2 h-11"
        />
        <Select
          value={selectedCategorySlug === '' ? ALL_DIGITAL_CATEGORIES_SENTINEL_VALUE : selectedCategorySlug}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={translate('allDigitalCategories', 'All Digital Categories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_DIGITAL_CATEGORIES_SENTINEL_VALUE}>
              {translate('allDigitalCategories', 'All Digital Categories')}
            </SelectItem>
            {digitalCategories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          className="w-full md:col-span-3 bg-primary hover:bg-primary/90 text-primary-foreground h-11"
        >
          <Search className="mr-2 h-5 w-5" /> {translate('searchDigitalBtn', 'Search Digital Services')}
        </Button>
      </form>

      {!selectedCategorySlug && !isLoading && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{translate('browseByCategory', 'Browse by Category')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {digitalCategories.map((cat) => {
              const CategoryIcon = getIconComponent(cat.icon as unknown as string);
              return (
                <Link key={cat.id} href={`/digital-services?category=${cat.slug}`} passHref>
                  <Card className="text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer p-4 h-full flex flex-col items-center justify-center border hover:border-accent">
                    <CategoryIcon className="h-10 w-10 text-accent mb-2" />
                    <CardTitle className="text-md font-semibold">{cat.name}</CardTitle>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading freelancers data...</div>
        ) : (
          <DigitalServicesGrid freelancers={filteredFreelancers} />
        )}
      </section>
    </div>
  );
}
