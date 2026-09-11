'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UnifiedSearchHeader } from '@/components/search/UnifiedSearchHeader';
import { EntityTabs } from '@/components/search/EntityTabs';
import { ActiveFilterChips } from '@/components/search/ActiveFilterChips';
import { SearchFilterSidebar } from '@/components/search/SearchFilterSidebar';
import { UnifiedResultCard } from '@/components/search/UnifiedResultCard';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';

import { unifiedSearchService } from '@/services/unifiedSearchService';
import type {
  SearchFilterState,
  SearchResponse,
  SearchEntityType,
  SearchSortOption,
} from '@/types/search';
import { cn } from '@/lib/utils';

const SORT_OPTIONS: { key: SearchSortOption; label: string }[] = [
  { key: 'relevance', label: 'الأكثر تطابقاً (Relevance)' },
  { key: 'popularity', label: 'الأكثر شعبية وتقييماً' },
  { key: 'newest', label: 'الأحدث إضافة' },
  { key: 'price_asc', label: 'السعر: من الأقل إلى الأعلى' },
  { key: 'price_desc', label: 'السعر: من الأعلى إلى الأقل' },
  { key: 'rating', label: 'أعلى تقييم (5 نجوم)' },
  { key: 'distance', label: 'الأقرب إليك (مسافة GPS)' },
];

export function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<SearchFilterState>(() => ({
    q: searchParams?.get('q') || '',
    entityType: (searchParams?.get('type') || searchParams?.get('entityType') || 'all') as SearchEntityType,
    category: searchParams?.get('category') || undefined,
    subcategory: searchParams?.get('subcategory') || undefined,
    wilaya: searchParams?.get('wilaya') || undefined,
    userLat: searchParams?.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    userLng: searchParams?.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
    distanceKm: searchParams?.get('distance') ? parseFloat(searchParams.get('distance')!) : undefined,
    minPrice: searchParams?.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams?.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    minRating: searchParams?.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
    onlyVerified: searchParams?.get('verified') === 'true',
    onlyDelivery: searchParams?.get('delivery') === 'true',
    onlyAvailable: searchParams?.get('available') === 'true',
    sort: (searchParams?.get('sort') || 'relevance') as SearchSortOption,
    page: parseInt(searchParams?.get('page') || '1', 10),
    pageSize: 12,
  }));

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setFilters({
      q: searchParams?.get('q') || '',
      entityType: (searchParams?.get('type') || searchParams?.get('entityType') || 'all') as SearchEntityType,
      category: searchParams?.get('category') || undefined,
      subcategory: searchParams?.get('subcategory') || undefined,
      wilaya: searchParams?.get('wilaya') || undefined,
      userLat: searchParams?.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      userLng: searchParams?.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      distanceKm: searchParams?.get('distance') ? parseFloat(searchParams.get('distance')!) : undefined,
      minPrice: searchParams?.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams?.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minRating: searchParams?.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      onlyVerified: searchParams?.get('verified') === 'true',
      onlyDelivery: searchParams?.get('delivery') === 'true',
      onlyAvailable: searchParams?.get('available') === 'true',
      sort: (searchParams?.get('sort') || 'relevance') as SearchSortOption,
      page: parseInt(searchParams?.get('page') || '1', 10),
      pageSize: 12,
    });
  }, [searchParams]);

  const performSearch = useCallback(async (currentFilters: SearchFilterState) => {
    setIsLoading(true);
    try {
      const response = await unifiedSearchService.search(currentFilters);
      setSearchResponse(response);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUrlParams = useCallback((updated: SearchFilterState) => {
    const params = new URLSearchParams();
    if (updated.q) params.set('q', updated.q);
    if (updated.entityType && updated.entityType !== 'all') params.set('type', updated.entityType);
    if (updated.category) params.set('category', updated.category);
    if (updated.subcategory) params.set('subcategory', updated.subcategory);
    if (updated.wilaya) params.set('wilaya', updated.wilaya);
    if (updated.userLat) params.set('lat', updated.userLat.toString());
    if (updated.userLng) params.set('lng', updated.userLng.toString());
    if (updated.distanceKm) params.set('distance', updated.distanceKm.toString());
    if (updated.minPrice) params.set('minPrice', updated.minPrice.toString());
    if (updated.maxPrice) params.set('maxPrice', updated.maxPrice.toString());
    if (updated.minRating) params.set('minRating', updated.minRating.toString());
    if (updated.onlyVerified) params.set('verified', 'true');
    if (updated.onlyDelivery) params.set('delivery', 'true');
    if (updated.onlyAvailable) params.set('available', 'true');
    if (updated.sort && updated.sort !== 'relevance') params.set('sort', updated.sort);
    if (updated.page && updated.page > 1) params.set('page', updated.page.toString());

    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleFiltersChange = (partial: Partial<SearchFilterState>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    updateUrlParams(next);
  };

  useEffect(() => {
    performSearch(filters);
  }, [filters, performSearch]);

  const handleResetFilters = () => {
    const fresh: SearchFilterState = {
      q: '',
      entityType: 'all',
      sort: 'relevance',
      page: 1,
      pageSize: 12,
    };
    setFilters(fresh);
    updateUrlParams(fresh);
  };

  const handleRemoveFilter = (key: keyof SearchFilterState) => {
    handleFiltersChange({ [key]: undefined, page: 1 });
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.wilaya) count++;
    if (filters.distanceKm) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minRating) count++;
    if (filters.onlyVerified) count++;
    if (filters.onlyDelivery) count++;
    if (filters.onlyAvailable) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();

  return (
    <div className="min-h-screen bg-background text-foreground space-y-6 pb-20">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pt-8 pb-6 px-4 border-b border-border/40">
        <div className="container mx-auto max-w-5xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>محرك البحث الذكي الموحد لمنصة خدماتك</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-headline">
            ابحث واكتشف كل ما تحتاجه في الجزائر
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            منتجات أصلية، خدمات حرفية معتمدة، سباكون، كهربائيون، متاجر، قاعات أفراح وحجوزات فورية
          </p>

          <div className="pt-2">
            <UnifiedSearchHeader
              initialQuery={filters.q}
              initialWilaya={filters.wilaya}
              initialEntityType={filters.entityType}
              onSearch={(q, w) => handleFiltersChange({ q, wilaya: w, page: 1 })}
              onToggleMobileFilters={() => setIsMobileFilterOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl">
        <EntityTabs
          activeType={filters.entityType}
          onChange={(type) => handleFiltersChange({ entityType: type, page: 1 })}
          facets={searchResponse?.facets}
        />
      </div>

      <main className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-1 sticky top-32 z-20">
            <SearchFilterSidebar
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="flex-1">
                <ActiveFilterChips
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleResetFilters}
                />
                {!activeFilterCount && (
                  <div className="text-xs text-muted-foreground font-medium">
                    {searchResponse ? (
                      <span>
                        تم العثور على <strong className="text-foreground">{searchResponse.total}</strong> نتيجة
                        {searchResponse.queryTimeMs ? ` في (${searchResponse.queryTimeMs}ms)` : ''}
                      </span>
                    ) : (
                      <span>جارِ البحث...</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden h-9 px-3 rounded-xl text-xs gap-1.5 font-medium relative"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  <span>الفلاتر</span>
                  {activeFilterCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border-border">
                      <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                      <span>{SORT_OPTIONS.find((s) => s.key === filters.sort)?.label || 'الترتيب'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.key}
                        onClick={() => handleFiltersChange({ sort: opt.key, page: 1 })}
                        className={cn(
                          'text-xs font-medium cursor-pointer',
                          filters.sort === opt.key && 'font-bold text-primary bg-primary/10'
                        )}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden sm:flex items-center rounded-xl border border-border/80 p-0.5 bg-muted/40">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="عرض شبكي"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="عرض قائمة"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 py-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl bg-muted/40 animate-pulse border border-border/40 p-4 flex flex-col justify-between"
                  >
                    <div className="w-full h-40 bg-muted/80 rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-2/3 h-4 bg-muted/80 rounded" />
                      <div className="w-full h-3 bg-muted/60 rounded" />
                    </div>
                    <div className="w-1/3 h-6 bg-muted/80 rounded" />
                  </div>
                ))}
              </div>
            ) : searchResponse && searchResponse.items.length > 0 ? (
              <div className="space-y-6">
                <div
                  className={cn(
                    'grid gap-4',
                    viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                  )}
                >
                  {searchResponse.items.map((item) => (
                    <UnifiedResultCard key={item.id} item={item} viewMode={viewMode} />
                  ))}
                </div>

                <SearchPagination
                  currentPage={searchResponse.page}
                  totalPages={searchResponse.totalPages}
                  totalItems={searchResponse.total}
                  pageSize={searchResponse.pageSize}
                  onPageChange={(page) => {
                    handleFiltersChange({ page });
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                />
              </div>
            ) : (
              <SearchEmptyState
                query={filters.q}
                onResetFilters={handleResetFilters}
                onSelectSuggestion={(term) => handleFiltersChange({ q: term, page: 1 })}
              />
            )}
          </div>
        </div>
      </main>

      <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border/40 sticky top-0 bg-card z-10">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>فلاتر البحث</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <SearchFilterSidebar
              filters={filters}
              onChange={(upd) => {
                handleFiltersChange(upd);
              }}
              onReset={() => {
                handleResetFilters();
                setIsMobileFilterOpen(false);
              }}
            />
            <div className="pt-4 sticky bottom-0 bg-card pb-4">
              <Button onClick={() => setIsMobileFilterOpen(false)} className="w-full rounded-xl font-bold h-11">
                عرض النتائج ({searchResponse?.total || 0})
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
