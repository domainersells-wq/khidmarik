import { NextRequest, NextResponse } from 'next/server';
import { unifiedSearchService } from '@/services/unifiedSearchService';
import type { SearchEntityType, SearchSortOption } from '@/types/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const entityType = (searchParams.get('type') || searchParams.get('entityType') || 'all') as SearchEntityType;
    const category = searchParams.get('category') || undefined;
    const subcategory = searchParams.get('subcategory') || undefined;
    const wilaya = searchParams.get('wilaya') || undefined;
    
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    const distanceKm = searchParams.get('distance') ? parseFloat(searchParams.get('distance')!) : undefined;
    
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    
    const onlyVerified = searchParams.get('verified') === 'true';
    const onlyDelivery = searchParams.get('delivery') === 'true';
    const onlyAvailable = searchParams.get('available') === 'true';
    
    const sort = (searchParams.get('sort') || 'relevance') as SearchSortOption;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

    const results = await unifiedSearchService.search({
      q,
      entityType,
      category,
      subcategory,
      wilaya,
      userLat,
      userLng,
      distanceKm,
      minPrice,
      maxPrice,
      minRating,
      onlyVerified,
      onlyDelivery,
      onlyAvailable,
      sort,
      page,
      pageSize
    });

    return NextResponse.json(results, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    });
  } catch (error: any) {
    console.error('Unified Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process search query', details: error.message },
      { status: 500 }
    );
  }
}
