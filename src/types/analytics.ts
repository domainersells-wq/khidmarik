/**
 * Khidmatik Unified Marketplace - Analytics & Business Intelligence Domain Types
 * Covers Platform Admin, Store Owner, Provider, and Advertising Performance Analytics.
 */

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | '3m' | '1y' | 'custom';

export interface DateRangeFilter {
  range: AnalyticsTimeRange;
  startDate?: string;
  endDate?: string;
}

export interface MetricComparison<T = number> {
  value: T;
  previousValue: T;
  percentageChange: number; // e.g. +18.4%
  formattedValue?: string;
  formattedPrevious?: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  revenue: number;
  commission: number;
  orders: number;
  bookings: number;
  visits: number;
  adSpend?: number;
}

export interface FunnelStage {
  stage: string;
  stageNameAr: string;
  count: number;
  conversionRateFromPrevious: number; // percentage from previous stage
  conversionRateFromTotal: number; // percentage from top of funnel
}

export interface TopCategoryItem {
  id: string;
  name: string;
  nameAr: string;
  type: 'PRODUCT' | 'SERVICE';
  salesCount: number;
  revenue: number;
  views: number;
  conversionRate: number;
}

export interface TopProductItem {
  id: string;
  title: string;
  storeName: string;
  imageUrl?: string;
  price: number;
  stock: number;
  unitsSold: number;
  revenue: number;
  views: number;
  conversionRate: number;
  addToCartRate: number;
}

export interface TopServiceItem {
  id: string;
  title: string;
  providerName: string;
  price: number;
  completedJobs: number;
  revenue: number;
  views: number;
  conversionRate: number;
  rating: number;
}

export interface TopStoreItem {
  id: string;
  storeName: string;
  ownerName: string;
  logoUrl?: string;
  ordersCount: number;
  grossSales: number;
  storeVisits: number;
  conversionRate: number;
  rating: number;
  reviewsCount: number;
  adRoas: number;
}

export interface TopProviderItem {
  id: string;
  providerName: string;
  category: string;
  completedJobs: number;
  grossRevenue: number;
  requestsCount: number;
  completionRate: number;
  cancellationRate: number;
  rating: number;
  reviewsCount: number;
}

export interface AdvertisingMetrics {
  impressions: number;
  clicks: number;
  ctr: number; // percentage
  spend: number;
  conversions: number; // orders generated
  revenue: number;
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend (e.g. 6.0x)
  storeVisitsFromAds: number;
  productViewsFromAds: number;
}

export interface ReviewAnalyticsBreakdown {
  totalReviews: number;
  averageRating: number;
  starDistribution: {
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
  ratingTrend: Array<{ date: string; avgRating: number }>;
}

export interface LowStockAlertItem {
  id: string;
  title: string;
  sku?: string;
  currentStock: number;
  threshold: number;
  unitsSoldInPeriod: number;
  averageDailySales: number;
  estimatedDaysRemaining: number;
}

/**
 * 1. PLATFORM ADMIN ANALYTICS
 */
export interface PlatformAdminAnalytics {
  timeRange: DateRangeFilter;
  kpis: {
    totalUsers: MetricComparison<number>;
    activeUsers: MetricComparison<number>;
    newUsers: MetricComparison<number>;
    totalStores: MetricComparison<number>;
    activeStores: MetricComparison<number>;
    totalProviders: MetricComparison<number>;
    activeProviders: MetricComparison<number>;
    totalOrders: MetricComparison<number>;
    completedOrders: MetricComparison<number>;
    cancelledOrders: MetricComparison<number>;
    totalBookings: MetricComparison<number>;
    completedBookings: MetricComparison<number>;
    grossRevenue: MetricComparison<number>;
    netRevenue: MetricComparison<number>;
    platformCommission: MetricComparison<number>;
    refundsTotal: MetricComparison<number>;
    withdrawalsTotal: MetricComparison<number>;
    disputedAmount: MetricComparison<number>;
    storeVisits: MetricComparison<number>;
    productViews: MetricComparison<number>;
    adImpressions: MetricComparison<number>;
    adClicks: MetricComparison<number>;
    conversionRate: MetricComparison<number>;
  };
  timeSeries: TimeSeriesPoint[];
  conversionFunnel: FunnelStage[];
  advertising: AdvertisingMetrics;
  reviews: ReviewAnalyticsBreakdown;
  topCategories: TopCategoryItem[];
  topProducts: TopProductItem[];
  topServices: TopServiceItem[];
  topStores: TopStoreItem[];
  topProviders: TopProviderItem[];
  geoDistribution: Array<{ wilaya: string; count: number; percentage: number }>;
}

/**
 * 2. STORE OWNER ANALYTICS
 */
export interface StoreOwnerAnalytics {
  storeId: string;
  storeName: string;
  timeRange: DateRangeFilter;
  kpis: {
    grossSales: MetricComparison<number>;
    totalOrders: MetricComparison<number>;
    netRevenue: MetricComparison<number>;
    averageOrderValue: MetricComparison<number>;
    conversionRate: MetricComparison<number>;
    totalProducts: number;
    activeProducts: number;
    outOfStockCount: number;
    lowStockCount: number;
    inventoryTotalValue: number;
    storeVisits: MetricComparison<number>;
    uniqueVisitors: MetricComparison<number>;
    productViews: MetricComparison<number>;
    addToCartCount: MetricComparison<number>;
    checkoutStarts: MetricComparison<number>;
    refundsTotal: MetricComparison<number>;
    cancelledOrders: MetricComparison<number>;
  };
  timeSeries: TimeSeriesPoint[];
  conversionFunnel: FunnelStage[];
  lowStockAlerts: LowStockAlertItem[];
  bestSellers: TopProductItem[];
  topCategories: TopCategoryItem[];
  advertising: AdvertisingMetrics;
  reviews: ReviewAnalyticsBreakdown;
}

/**
 * 3. SERVICE PROVIDER ANALYTICS
 */
export interface ProviderAnalytics {
  providerId: string;
  providerName: string;
  timeRange: DateRangeFilter;
  kpis: {
    totalRequests: MetricComparison<number>;
    completedJobs: MetricComparison<number>;
    cancelledBookings: MetricComparison<number>;
    grossRevenue: MetricComparison<number>;
    netRevenue: MetricComparison<number>;
    averageJobValue: MetricComparison<number>;
    completionRate: MetricComparison<number>; // %
    cancellationRate: MetricComparison<number>; // %
    bookingConversionRate: MetricComparison<number>; // %
    serviceViews: MetricComparison<number>;
    uniqueVisitors: MetricComparison<number>;
    averageRating: number;
    totalReviews: number;
  };
  timeSeries: TimeSeriesPoint[];
  topServices: TopServiceItem[];
  reviews: ReviewAnalyticsBreakdown;
}
