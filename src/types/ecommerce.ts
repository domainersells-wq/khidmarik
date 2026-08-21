export interface ProductVariationOption {
  id: string;
  nameAr: string;
  nameEn: string;
  value: string; // e.g. '#1e293b' or 'XL' or '256GB'
  imagePreviewUrl?: string;
  extraPriceDA: number;
}

export interface ProductVariationGroup {
  id: string;
  type: 'color' | 'size' | 'model' | 'storage' | 'material';
  nameAr: string;
  nameEn: string;
  options: ProductVariationOption[];
}

export interface ProductSKU {
  id: string;
  combinationKey: string; // e.g. "black_XL_256GB"
  skuCode: string;
  priceDA: number;
  originalPriceDA: number;
  stockQuantity: number;
  imageGallery: string[];
}

export interface TieredCoupon {
  id: string;
  code: string;
  issuer: 'platform' | 'merchant';
  merchantName?: string;
  discountDA: number;
  minimumSpendDA: number;
  validUntil: string;
  claimed: boolean;
  badgeAr: string;
  badgeEn: string;
}

export interface DailyCheckinStreak {
  currentDayStreak: number;
  totalCoinsBalance: number;
  hasClaimedToday: boolean;
  coinValueRatioDA: number; // e.g. 100 coins = 100 DA
  history: { day: number; coins: number; date: string; claimed: boolean }[];
}

export interface ShippingRateWilaya {
  wilayaCode: string;
  wilayaNameAr: string;
  wilayaNameEn: string;
  homeDeliveryPriceDA: number;
  stopDeskPriceDA: number;
  estimatedDays: string;
  hubName: string; // e.g. 'مكتب ياليدين دالي إبراهيم'
}

export type TrackingStatus = 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'SORTING_HUB' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'RETURNED';

export interface PackageTrackingEvent {
  status: TrackingStatus;
  titleAr: string;
  titleEn: string;
  location: string;
  timestamp: string;
  descriptionAr: string;
  isCompleted: boolean;
}

export interface PackageShipment {
  trackingCode: string; // e.g. 'DZ-YAL-9841203'
  carrierName: 'Yalidine Express' | 'ZR Express' | 'Khidmatik Express Logistics';
  shippingMethod: 'home' | 'stop_desk';
  shippingCostDA: number;
  destinationWilaya: string;
  destinationAddress: string;
  events: PackageTrackingEvent[];
  isCombinedShipping: boolean;
  combinedStoresCount?: number;
}

export interface BuyerProtectionEscrow {
  orderId: string;
  totalAmountDA: number;
  protectionDaysRemaining: number;
  escrowStatus: 'LOCKED' | 'RELEASED_TO_SELLER' | 'DISPUTED' | 'REFUNDED_TO_BUYER';
  deliveredAt?: string;
  autoReleaseDeadline: string;
  refundGuaranteeDays: number; // 5 days
}

export interface FlashDealItem {
  id: string;
  titleAr: string;
  titleEn: string;
  discountPercent: number;
  dealPriceDA: number;
  originalPriceDA: number;
  soldUnits: number;
  totalUnits: number;
  endsInSeconds: number;
  thumbnailUrl: string;
}

export interface VerifiedCustomerReview {
  id: string;
  customerName: string;
  avatarUrl: string;
  verifiedPurchase: boolean;
  rating: number;
  date: string;
  selectedVariation: string;
  comment: string;
  photos: string[];
  helpfulCount: number;
}
