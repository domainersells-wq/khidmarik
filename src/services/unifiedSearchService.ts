import { supabase } from '@/lib/supabase';
import type { 
  SearchFilterState, 
  SearchResponse, 
  UnifiedSearchResultItem, 
  SearchFacetCounts, 
  AutocompleteSuggestion,
  SearchEntityType 
} from '@/types/search';
import { categories, digitalServiceCategories, partCategories } from '@/data/mock';

/**
 * Calculates spherical distance in kilometers between two coordinates using Haversine formula.
 */
export function calculateHaversineDistance(
  lat1?: number, 
  lon1?: number, 
  lat2?: number, 
  lon2?: number
): number | undefined {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return undefined;
  }
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Normalizes text for insensitive Arabic & Latin search matching
 */
function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/**
 * Rich seed dataset for fallback & immediate demo responsiveness
 */
const SEED_CATALOG_ITEMS: UnifiedSearchResultItem[] = [
  // PRODUCTS
  {
    id: 'prod-001',
    entityType: 'products',
    title: 'مضخة مياه ذكية عالية الضغط 1.5 حصان (Smart Water Pump)',
    description: 'مضخة مياه أوتوماتيكية موفرة للطاقة مع تحكم رقمي في الضغط ومقاومة للصدأ، صناعة جزائرية بمعايير أوروبية.',
    categoryName: 'Plumbers & Hardware',
    categorySlug: 'plumbers',
    subcategorySlug: 'pumps',
    price: 18500,
    discountPrice: 16500,
    currency: 'DA',
    rating: 4.9,
    reviewsCount: 38,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    galleryUrls: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60'],
    ownerName: 'مؤسسة الهضاب للتجهيزات الصناعية',
    ownerId: 'store-101',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    stock: 24,
    wilaya: '16 - Alger',
    city: 'Bab Ezzouar',
    latitude: 36.7214,
    longitude: 3.1822,
    createdAt: '2026-08-20T10:00:00Z',
    tags: ['water pump', 'مضخة', 'سباكة', 'alger'],
    badge: 'Best Seller',
    actionUrl: '/marketplace?item=prod-001'
  },
  {
    id: 'prod-002',
    entityType: 'products',
    title: 'طقم مفاتيح وعدة تصليح ميكانيكية احترافية 150 قطعة',
    description: 'حقيبة متكاملة من فولاذ الكروم المقاوم للصدمات والصدأ لجميع أعمال الصيانة المنزلية والسيارات.',
    categoryName: 'General Hardware & DIY',
    categorySlug: 'general-hardware-diy',
    subcategorySlug: 'tools',
    price: 9800,
    currency: 'DA',
    rating: 4.8,
    reviewsCount: 52,
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=60',
    ownerName: 'متجر المحترف للعتاد',
    ownerId: 'store-102',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    stock: 15,
    wilaya: '31 - Oran',
    city: 'Es Senia',
    latitude: 35.6511,
    longitude: -0.6315,
    createdAt: '2026-08-18T14:30:00Z',
    tags: ['tools', 'عدة', 'تصليح', 'oran'],
    actionUrl: '/marketplace?item=prod-002'
  },
  {
    id: 'prod-003',
    entityType: 'products',
    title: 'لوحة تحكم ذكية بالطاقة الشمسية 3000W Inverter',
    description: 'محول طاقة شمسية هجين نقي مع شاشة LCD وتوافق كامل مع بطاريات الليثيوم.',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    subcategorySlug: 'solar',
    price: 64000,
    discountPrice: 59900,
    currency: 'DA',
    rating: 4.95,
    reviewsCount: 19,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=60',
    ownerName: 'طاقة المستقبل الجزائر',
    ownerId: 'store-103',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    stock: 8,
    wilaya: '25 - Constantine',
    city: 'Ali Mendjeli',
    latitude: 36.2652,
    longitude: 6.6433,
    createdAt: '2026-08-22T08:15:00Z',
    tags: ['solar', 'طاقة شمسية', 'inverter', 'constantine'],
    badge: 'Eco Friendly',
    actionUrl: '/marketplace?item=prod-003'
  },
  {
    id: 'prod-004',
    entityType: 'products',
    title: 'مكيف هواء انفرتر اقتصادي 12000 BTU موفر للطاقة',
    description: 'تبريد وتدفئة فائقة السرعة مع فلتر مضاد للبكتيريا وضمان شامل 3 سنوات.',
    categoryName: 'HVAC Services',
    categorySlug: 'hvac-services',
    subcategorySlug: 'air-conditioning',
    price: 52000,
    currency: 'DA',
    rating: 4.7,
    reviewsCount: 41,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
    ownerName: 'إلكترونيات السلام',
    ownerId: 'store-104',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    stock: 11,
    wilaya: '16 - Alger',
    city: 'Hussein Dey',
    latitude: 36.7451,
    longitude: 3.0901,
    createdAt: '2026-08-15T12:00:00Z',
    tags: ['ac', 'مكيف', 'hvac', 'alger'],
    actionUrl: '/marketplace?item=prod-004'
  },

  // SERVICES & BOOKINGS
  {
    id: 'srv-001',
    entityType: 'services',
    title: 'خدمة ترصيص وكشف تسربات المياه بالموجات الصوتية والأشعة',
    description: 'كشف تسربات الأنابيب المخفية داخل الجدران والأرضيات بدون تكسير مع إصلاح فوري وضمان معتمد.',
    categoryName: 'Plumbers',
    categorySlug: 'plumbers',
    subcategorySlug: 'leak-detection',
    price: 4500,
    priceUnit: 'تدخل / Job',
    currency: 'DA',
    rating: 4.95,
    reviewsCount: 64,
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=60',
    ownerName: 'المعلم عمار بن يحيى (Ammar Plomberie)',
    ownerId: 'prov-201',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: '16 - Alger',
    city: 'Hydra / Dely Ibrahim',
    latitude: 36.7432,
    longitude: 3.0251,
    createdAt: '2026-08-21T09:00:00Z',
    tags: ['plumbing', 'سباكة', 'تسربات', 'sos', 'alger'],
    badge: 'Top Pro 2026',
    actionUrl: '/craftsmen-dispatch?service=plumbing_leak',
    bookingUrl: '/reservations/book?serviceId=srv-001'
  },
  {
    id: 'srv-002',
    entityType: 'services',
    title: 'صيانة وتركيب شبكات الكهرباء المنزلية والصناعية 220V/380V',
    description: 'فحص العدادات، تركيب لوحات القواطع الأوتوماتيكية، وتصليح الشورت وسيركوي الكهرباء في أسرع وقت.',
    categoryName: 'Electricians',
    categorySlug: 'electricians',
    subcategorySlug: 'wiring',
    price: 3500,
    priceUnit: 'زيارة / Job',
    currency: 'DA',
    rating: 4.88,
    reviewsCount: 47,
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&auto=format&fit=crop&q=60',
    ownerName: 'كهرباء النور المحترفة (Kamel Elec)',
    ownerId: 'prov-202',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: '31 - Oran',
    city: 'Maraval',
    latitude: 35.6894,
    longitude: -0.6433,
    createdAt: '2026-08-23T11:45:00Z',
    tags: ['electrician', 'كهرباء', 'صيانة', 'oran'],
    badge: 'Verified Electrician',
    actionUrl: '/craftsmen-dispatch?service=electrical_failure',
    bookingUrl: '/reservations/book?serviceId=srv-002'
  },
  {
    id: 'srv-003',
    entityType: 'services',
    title: 'تصميم مواقع وتطبيقات المتاجر الإلكترونية المتكاملة (Next.js & Supabase)',
    description: 'تطوير منصات ويب سريعة متوافقة مع الهواتف بوابات الدفع الإلكتروني الجزائرية (الذهبية و CIB) ولوحة تحكم شاملة.',
    categoryName: 'Web Development',
    categorySlug: 'web-development',
    subcategorySlug: 'e-commerce',
    price: 45000,
    priceUnit: 'مشروع / Project',
    currency: 'DA',
    rating: 5.0,
    reviewsCount: 31,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60',
    ownerName: 'سفيان تيك ستوديو (Sofiane Dev)',
    ownerId: 'prov-203',
    isVerified: true,
    deliveryAvailable: false,
    isAvailable: true,
    wilaya: '16 - Alger',
    city: 'Kouba',
    latitude: 36.7267,
    longitude: 3.0864,
    createdAt: '2026-08-19T16:20:00Z',
    tags: ['web', 'development', 'programming', 'digital'],
    badge: 'Pro Freelancer',
    actionUrl: '/digital-services/web-development',
    bookingUrl: '/digital-services/order?id=srv-003'
  },
  {
    id: 'srv-004',
    entityType: 'bookings',
    title: 'حجز موعد فحص وصيانة دورية للسيارات والشاحنات الخفيفة',
    description: 'فحص بالكمبيوتر سكانير متقدم لجميع أنواع السيارات الأوروبية والآسيوية مع تقرير فني شامل.',
    categoryName: 'Automotive Services',
    categorySlug: 'automotive-services',
    subcategorySlug: 'diagnostics',
    price: 3000,
    priceUnit: 'فحص / Scanner',
    currency: 'DA',
    rating: 4.9,
    reviewsCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60',
    ownerName: 'مركز الأوتو كلينيك تشخيص السيارات',
    ownerId: 'prov-204',
    isVerified: true,
    deliveryAvailable: false,
    isAvailable: true,
    wilaya: '09 - Blida',
    city: 'Ouled Yaich',
    latitude: 36.4883,
    longitude: 2.8456,
    createdAt: '2026-08-17T13:10:00Z',
    tags: ['scanner', 'سيارات', 'ميكانيك', 'blida'],
    badge: 'Instant Booking',
    actionUrl: '/reservations/book?serviceId=srv-004',
    bookingUrl: '/reservations/book?serviceId=srv-004'
  },

  // PROVIDERS & PROFESSIONALS
  {
    id: 'prov-001',
    entityType: 'providers',
    title: 'الأستاذ عبد القادر رحماني - مهندس ديكور ودهانات فندقية',
    description: 'خبرة أكثر من 15 سنة في الدهانات العصرية (Stucco, Velvet, San Marco) وتشطيب الشقق والفيلات.',
    categoryName: 'Painters & Decor',
    categorySlug: 'painters',
    price: 800,
    priceUnit: 'متر مربع / m²',
    currency: 'DA',
    rating: 4.92,
    reviewsCount: 73,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
    ownerName: 'عبد القادر رحماني',
    ownerId: 'user-301',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: '16 - Alger',
    city: 'Cheraga',
    latitude: 36.7667,
    longitude: 2.9500,
    createdAt: '2026-08-10T10:00:00Z',
    tags: ['painter', 'دهان', 'ديكور', 'alger'],
    badge: 'Master Artisan',
    actionUrl: '/provider/prov-001'
  },
  {
    id: 'prov-002',
    entityType: 'providers',
    title: 'الدكتورة ليلى مرابط - عيادة طب وجراحة الفم والأسنان',
    description: 'تبييض الأسنان بالليزر، تقويم، زراعة وابتسامة هوليوود بأحدث التجهيزات الطبية الرقمية.',
    categoryName: 'Doctors & Health',
    categorySlug: 'doctors',
    price: 2500,
    priceUnit: 'كشف / Consultation',
    currency: 'DA',
    rating: 4.98,
    reviewsCount: 112,
    imageUrl: 'https://images.unsplash.com/photo-1594824813589-3221b66dfa99?w=500&auto=format&fit=crop&q=60',
    ownerName: 'د. ليلى مرابط',
    ownerId: 'user-302',
    isVerified: true,
    deliveryAvailable: false,
    isAvailable: true,
    wilaya: '31 - Oran',
    city: 'Akid Lotfi',
    latitude: 35.7103,
    longitude: -0.6087,
    createdAt: '2026-08-05T08:30:00Z',
    tags: ['dentist', 'طبيب', 'أسنان', 'oran'],
    badge: 'Medical Specialist',
    actionUrl: '/provider/prov-002',
    bookingUrl: '/reservations/book?providerId=prov-002'
  },

  // STORES & LISTINGS
  {
    id: 'store-001',
    entityType: 'stores',
    title: 'سوبرماركت التميز للمنتجات الغذائية والمنزلية',
    description: 'أكبر تشكيلة من المنتجات المحلية والمستوردة مع خدمة التوصيل السريع إلى باب منزلك في أقل من ساعة.',
    categoryName: 'Groceries & Supermarkets',
    categorySlug: 'groceries',
    price: 0,
    currency: 'DA',
    rating: 4.85,
    reviewsCount: 140,
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
    ownerName: 'سوبرماركت التميز',
    ownerId: 'store-001',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: '16 - Alger',
    city: 'Sidi Yahia / Hydra',
    latitude: 36.7388,
    longitude: 3.0312,
    createdAt: '2026-08-01T09:00:00Z',
    tags: ['supermarket', 'groceries', 'بقالة', 'alger'],
    badge: 'Express Delivery',
    actionUrl: '/listings/store-001'
  },
  {
    id: 'store-002',
    entityType: 'stores',
    title: 'معرض الأندلس للأثاث الفاخر والديكور المنزلي',
    description: 'صالونات مغربية وعصرية، غرف نوم فاخرة، مطابخ مجهزة وتجهيزات مكتبية بجودة عالية وضمان 5 سنوات.',
    categoryName: 'Furniture & Home',
    categorySlug: 'furniture',
    price: 0,
    currency: 'DA',
    rating: 4.79,
    reviewsCount: 56,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60',
    ownerName: 'أثاث الأندلس',
    ownerId: 'store-002',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: '19 - Sétif',
    city: 'Ain Oulmene',
    latitude: 35.9189,
    longitude: 5.2981,
    createdAt: '2026-08-04T11:00:00Z',
    tags: ['furniture', 'أثاث', 'صالون', 'setif'],
    badge: 'Verified Showroom',
    actionUrl: '/listings/store-002'
  },
  {
    id: 'listing-001',
    entityType: 'listings',
    title: 'قاعة الأفراح والمؤتمرات الملكية (Royal Palace Palace Banquet Hall)',
    description: 'قاعة فسيحة ومكيفة تسع حتى 600 شخص مجهزة بأحدث أنظمة الصوت والإضاءة مع خدمة البوفيه والضيافة VIP.',
    categoryName: 'Banquet Halls & Events',
    categorySlug: 'banquet-halls',
    price: 180000,
    priceUnit: 'حفل / Event',
    currency: 'DA',
    rating: 4.94,
    reviewsCount: 82,
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&auto=format&fit=crop&q=60',
    ownerName: 'مجمع قاعات الملكية',
    ownerId: 'hall-001',
    isVerified: true,
    deliveryAvailable: false,
    isAvailable: true,
    wilaya: '16 - Alger',
    city: 'Ain Benian',
    latitude: 36.8021,
    longitude: 2.9234,
    createdAt: '2026-08-11T15:00:00Z',
    tags: ['banquet', 'قاعة حفلات', 'أعراس', 'alger'],
    badge: 'VIP Venue',
    actionUrl: '/banquet-halls/hall-001',
    bookingUrl: '/reservations/book?hallId=hall-001'
  },

  // CATEGORIES
  {
    id: 'cat-item-1',
    entityType: 'categories',
    title: 'حرف وخدمات الصيانة المنزلية (Home & SOS Services)',
    description: 'تصفح نخبة السباكين، الكهربائيين، الفنيين والنجارين المعتمدين في جميع ولايات الجزائر.',
    categoryName: 'Home Services',
    categorySlug: 'home-services',
    price: 0,
    currency: 'DA',
    rating: 5.0,
    reviewsCount: 350,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
    ownerName: 'خدماتك',
    ownerId: 'khidmatik-system',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: 'All Algeria',
    createdAt: '2026-08-01T00:00:00Z',
    tags: ['category', 'خدمات', 'صيانة', 'سباكة', 'كهرباء'],
    actionUrl: '/search?category=home-services'
  },
  {
    id: 'cat-item-2',
    entityType: 'categories',
    title: 'المتجر وسوق قطع الغيار (Parts & Marketplace)',
    description: 'قطع غيار أصلية، عتاد، أدوات كهربائية ومنتجات صنع في الجزائر بأسعار تنافسية.',
    categoryName: 'Marketplace',
    categorySlug: 'marketplace',
    price: 0,
    currency: 'DA',
    rating: 5.0,
    reviewsCount: 520,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    ownerName: 'خدماتك',
    ownerId: 'khidmatik-system',
    isVerified: true,
    deliveryAvailable: true,
    isAvailable: true,
    wilaya: 'All Algeria',
    createdAt: '2026-08-01T00:00:00Z',
    tags: ['category', 'سوق', 'منتجات', 'قطع غيار'],
    actionUrl: '/search?entityType=products'
  }
];

export const unifiedSearchService = {
  /**
   * Main advanced search query method
   */
  async search(filters: Partial<SearchFilterState>): Promise<SearchResponse> {
    const startTime = performance.now();
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize || 12));
    const entityType = filters.entityType || 'all';
    const sort = filters.sort || 'relevance';

    // 1. Try Supabase RPC search function first
    try {
      const { data, error } = await supabase.rpc('search_unified_catalog', {
        p_keyword: filters.q || null,
        p_entity_type: entityType,
        p_category_slug: filters.category || null,
        p_subcategory_slug: filters.subcategory || null,
        p_wilaya_code: filters.wilaya || null,
        p_user_lat: filters.userLat || null,
        p_user_lng: filters.userLng || null,
        p_max_distance_km: filters.distanceKm || null,
        p_min_price: filters.minPrice || null,
        p_max_price: filters.maxPrice || null,
        p_min_rating: filters.minRating || null,
        p_only_verified: !!filters.onlyVerified,
        p_only_delivery: !!filters.onlyDelivery,
        p_only_available: !!filters.onlyAvailable,
        p_sort_by: sort,
        p_page: page,
        p_page_size: pageSize
      });

      if (!error && data && Array.isArray(data.items) && data.items.length > 0) {
        return {
          items: data.items.map((item: any) => ({
            id: item.item_id || item.id,
            entityType: (item.entity_type || 'products') as SearchEntityType,
            title: item.title || item.name,
            description: item.description || '',
            categoryName: item.category_name || item.category || 'General',
            categorySlug: item.category_slug || item.category || 'general',
            subcategorySlug: item.subcategory_slug,
            price: Number(item.price || item.price_da || 0),
            priceUnit: item.price_unit,
            currency: item.currency || 'DA',
            rating: Number(item.rating || 5.0),
            reviewsCount: Number(item.reviews_count || 0),
            imageUrl: item.image_url || (item.gallery_urls && item.gallery_urls[0]) || '/placeholder.png',
            galleryUrls: item.gallery_urls || [],
            ownerName: item.owner_name || 'Khidmatik Partner',
            ownerId: item.owner_id || '',
            isVerified: !!item.is_verified,
            deliveryAvailable: !!item.delivery_available,
            isAvailable: item.is_available !== false,
            wilaya: item.wilaya || 'Algeria',
            city: item.city,
            latitude: item.latitude,
            longitude: item.longitude,
            distanceKm: item.distance_km,
            createdAt: item.created_at || new Date().toISOString(),
            tags: item.tags || [],
            badge: item.badge,
            actionUrl: item.action_url || `/listings/${item.item_id || item.id}`,
            bookingUrl: item.booking_url
          })),
          total: data.total || data.items.length,
          page,
          pageSize,
          totalPages: data.totalPages || Math.ceil((data.total || data.items.length) / pageSize),
          facets: data.facets || {
            all: data.total,
            products: 0,
            services: 0,
            providers: 0,
            stores: 0,
            listings: 0,
            bookings: 0,
            categories: 0
          },
          queryTimeMs: Math.round(performance.now() - startTime)
        };
      }
    } catch (e) {
      console.warn('Supabase search RPC failed, falling back to rich indexed search catalog:', e);
    }

    // 2. High-Performance Client & Fallback Search Engine
    return this.executeFallbackSearch(filters, startTime);
  },

  /**
   * Resilient fallback search algorithm with fuzzy scoring and dynamic aggregation
   */
  executeFallbackSearch(filters: Partial<SearchFilterState>, startTime: number): SearchResponse {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize || 12));
    const targetEntityType = filters.entityType || 'all';
    const queryTerm = normalizeText(filters.q);
    const queryTokens = queryTerm.split(' ').filter(Boolean);

    // Filter items
    let matched = SEED_CATALOG_ITEMS.filter((item) => {
      // 1. Entity type filtering
      if (targetEntityType !== 'all') {
        if (targetEntityType === 'bookings') {
          if (item.entityType !== 'bookings' && !item.bookingUrl) return false;
        } else if (targetEntityType === 'listings') {
          if (item.entityType !== 'listings' && item.entityType !== 'stores') return false;
        } else if (item.entityType !== targetEntityType) {
          return false;
        }
      }

      // 2. Keyword matching with token intersection & scoring
      if (queryTokens.length > 0) {
        const itemBlob = normalizeText(
          `${item.title} ${item.description} ${item.categoryName} ${item.ownerName} ${item.wilaya} ${item.city || ''} ${(item.tags || []).join(' ')}`
        );
        const matchesAllTokens = queryTokens.every((token) => itemBlob.includes(token));
        if (!matchesAllTokens) return false;
      }

      // 3. Category & Subcategory
      if (filters.category && filters.category !== 'all') {
        const normCat = normalizeText(filters.category);
        const itemCatSlug = normalizeText(item.categorySlug);
        const itemCatName = normalizeText(item.categoryName);
        if (!itemCatSlug.includes(normCat) && !itemCatName.includes(normCat) && !normCat.includes(itemCatSlug)) {
          return false;
        }
      }
      if (filters.subcategory && filters.subcategory !== 'all') {
        const normSub = normalizeText(filters.subcategory);
        if (item.subcategorySlug && !normalizeText(item.subcategorySlug).includes(normSub)) {
          return false;
        }
      }

      // 4. Wilaya / Location
      if (filters.wilaya && filters.wilaya !== 'all') {
        const normWilaya = normalizeText(filters.wilaya);
        const itemWilaya = normalizeText(item.wilaya);
        if (!itemWilaya.includes(normWilaya) && !normWilaya.includes(itemWilaya)) {
          return false;
        }
      }

      // 5. Price Range
      if (filters.minPrice !== undefined && item.price > 0 && item.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && item.price > 0 && item.price > filters.maxPrice) {
        return false;
      }

      // 6. Rating
      if (filters.minRating !== undefined && item.rating < filters.minRating) {
        return false;
      }

      // 7. Verified Badge
      if (filters.onlyVerified && !item.isVerified) {
        return false;
      }

      // 8. Delivery Availability
      if (filters.onlyDelivery && !item.deliveryAvailable) {
        return false;
      }

      // 9. Availability / In Stock
      if (filters.onlyAvailable && !item.isAvailable) {
        return false;
      }

      // 10. Distance / Radius
      if (filters.userLat && filters.userLng && item.latitude && item.longitude) {
        const dist = calculateHaversineDistance(filters.userLat, filters.userLng, item.latitude, item.longitude);
        item.distanceKm = dist;
        if (filters.distanceKm && dist !== undefined && dist > filters.distanceKm) {
          return false;
        }
      }

      return true;
    });

    // Calculate dynamic facets across all entity types for current filters (excluding entityType restriction)
    const facetCounts: SearchFacetCounts = {
      all: 0,
      products: 0,
      services: 0,
      providers: 0,
      stores: 0,
      listings: 0,
      bookings: 0,
      categories: 0
    };

    SEED_CATALOG_ITEMS.forEach((item) => {
      // Basic keyword check for facet count
      if (queryTokens.length > 0) {
        const itemBlob = normalizeText(
          `${item.title} ${item.description} ${item.categoryName} ${item.ownerName} ${item.wilaya} ${(item.tags || []).join(' ')}`
        );
        if (!queryTokens.every((token) => itemBlob.includes(token))) return;
      }
      facetCounts.all++;
      if (item.entityType === 'products') facetCounts.products++;
      if (item.entityType === 'services') facetCounts.services++;
      if (item.entityType === 'providers') facetCounts.providers++;
      if (item.entityType === 'stores') facetCounts.stores++;
      if (item.entityType === 'listings' || item.entityType === 'stores') facetCounts.listings++;
      if (item.entityType === 'bookings' || item.bookingUrl) facetCounts.bookings++;
      if (item.entityType === 'categories') facetCounts.categories++;
    });

    // Sorting
    const sort = filters.sort || 'relevance';
    matched.sort((a, b) => {
      if (sort === 'popularity') return b.reviewsCount - a.reviewsCount;
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'distance' && a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      // Default: relevance score
      if (queryTerm) {
        const aTitle = normalizeText(a.title);
        const bTitle = normalizeText(b.title);
        const aStarts = aTitle.startsWith(queryTerm) ? 2 : aTitle.includes(queryTerm) ? 1 : 0;
        const bStarts = bTitle.startsWith(queryTerm) ? 2 : bTitle.includes(queryTerm) ? 1 : 0;
        if (bStarts !== aStarts) return bStarts - aStarts;
      }
      return b.rating - a.rating;
    });

    const total = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const paginatedItems = matched.slice(offset, offset + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      facets: facetCounts,
      queryTimeMs: Math.round(performance.now() - startTime)
    };
  },

  /**
   * Fast autocomplete suggestions for the unified search bar
   */
  async getAutocompleteSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
    if (!query || query.trim().length < 1) return [];
    const norm = normalizeText(query);

    const suggestions: AutocompleteSuggestion[] = [];

    // Match categories
    categories.forEach((cat) => {
      if (normalizeText(cat.name).includes(norm) || normalizeText(cat.slug).includes(norm)) {
        suggestions.push({
          id: `cat-${cat.id}`,
          title: cat.name,
          type: 'categories',
          category: 'Category',
          url: `/search?category=${cat.slug}`,
          badge: 'Category'
        });
      }
    });

    // Match seed items
    SEED_CATALOG_ITEMS.forEach((item) => {
      if (
        normalizeText(item.title).includes(norm) ||
        normalizeText(item.ownerName).includes(norm) ||
        (item.tags && item.tags.some(t => normalizeText(t).includes(norm)))
      ) {
        suggestions.push({
          id: item.id,
          title: item.title,
          type: item.entityType,
          category: item.categoryName,
          url: item.actionUrl,
          badge: item.badge || item.entityType.toUpperCase(),
          image: item.imageUrl
        });
      }
    });

    return suggestions.slice(0, 7);
  },

  /**
   * Popular trending search keywords
   */
  getPopularSearchKeywords(): string[] {
    return [
      'سباك طارئ (Plumber SOS)',
      'تسربات المياه',
      'مكيفات (Air Conditioners)',
      'كهربائي معتمد',
      'قطع غيار أصلية',
      'قاعات أفراح الجزائر',
      'تصميم مواقع متجر',
      'طاقة شمسية'
    ];
  }
};
