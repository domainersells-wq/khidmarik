export type SearchEntityType = 
  | 'all' 
  | 'products' 
  | 'services' 
  | 'providers' 
  | 'stores' 
  | 'listings' 
  | 'bookings' 
  | 'categories';

export type SearchSortOption = 
  | 'relevance' 
  | 'popularity' 
  | 'newest' 
  | 'price_asc' 
  | 'price_desc' 
  | 'rating' 
  | 'distance';

export interface SearchFilterState {
  q: string;
  entityType: SearchEntityType;
  category?: string;
  subcategory?: string;
  wilaya?: string;
  userLat?: number;
  userLng?: number;
  distanceKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onlyVerified?: boolean;
  onlyDelivery?: boolean;
  onlyAvailable?: boolean;
  sort: SearchSortOption;
  page: number;
  pageSize: number;
}

export interface UnifiedSearchResultItem {
  id: string;
  entityType: SearchEntityType;
  title: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  subcategorySlug?: string;
  price: number;
  priceUnit?: string;
  currency: string;
  rating: number;
  reviewsCount: number;
  imageUrl?: string;
  galleryUrls?: string[];
  ownerName: string;
  ownerId: string;
  isVerified: boolean;
  deliveryAvailable: boolean;
  isAvailable: boolean;
  wilaya: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  createdAt: string;
  tags?: string[];
  badge?: string;
  discountPrice?: number;
  stock?: number;
  actionUrl: string;
  bookingUrl?: string;
}

export interface SearchFacetCounts {
  all: number;
  products: number;
  services: number;
  providers: number;
  stores: number;
  listings: number;
  bookings: number;
  categories: number;
}

export interface SearchResponse {
  items: UnifiedSearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: SearchFacetCounts;
  queryTimeMs?: number;
}

export interface AutocompleteSuggestion {
  id: string;
  title: string;
  type: SearchEntityType;
  category?: string;
  url: string;
  badge?: string;
  image?: string;
}
