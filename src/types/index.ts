
import type { LucideIcon } from 'lucide-react';

export interface DetailedRatings {
  timeliness?: number; // 1-5
  qualityOfWork?: number; // 1-5
  cleanliness?: number; // 1-5
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO string format
  detailedRatings?: DetailedRatings;
}

export type ListingType = 'store' | 'professional' | 'freelancer' | 'hotel' | 'dormitory' | 'photographer';

export interface VerifiedBadge {
  name: string;
  icon?: LucideIcon; // e.g., ShieldCheck, Award
  description?: string; // For tooltip
}

// For Product Variants
export interface ProductVariantOption {
  name: string; // e.g., "Color", "Size"
  values: string[]; // e.g., ["Red", "Blue", "Green"], ["S", "M", "L"]
}

export interface ProductVariantAttribute {
  name: string; // e.g., "Color"
  value: string; // e.g., "Red"
}

export interface ProductVariant {
  id: string; // Unique ID for this specific variant combination
  attributes: ProductVariantAttribute[]; // e.g., [{ name: "Color", value: "Red" }, { name: "Size", value: "L" }]
  price: number; // Price for this specific variant
  discountPrice?: number; // Optional: Discounted price
  stock: number; // Stock quantity for this variant
  image?: string; // Optional: Specific image for this variant
  sku?: string; // Optional: Stock Keeping Unit
  barcode?: string;
  status?: 'available' | 'out_of_stock';
}

export interface ProductItem {
  id: string;
  slug: string; // For generating product URLs
  name: string;
  description?: string;
  category?: string;
  baseImageUrl?: string; // Main image for the product
  dataAiHint?: string;

  variantOptions?: ProductVariantOption[]; // Defines available option types (e.g., Color, Size)
  variants?: ProductVariant[]; // Actual combinations

  requiresInstallation?: boolean;
  installationServiceCategory?: string; // e.g., 'Plumbers', 'Electricians' (should match a Category slug)
  installationTaskName?: string; // e.g., "Chandelier Installation", "AC Unit Setup"
  isMadeInAlgeria?: boolean;
  expiryDate?: string; // Optional: For perishable goods, ISO string
}

export interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string;
  paymentType: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  date: string;
  total: number;
  profit: number;
  status: 'pending' | 'processing' | 'packed' | 'ready_to_ship' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  items: number;
  productName: string;
  productImageUrl: string;
  returnStatus: 'none' | 'requested' | 'approved' | 'rejected' | 'refunded';
  marketplace: string;
  city: string;
  courier: string;
  trackingNumber: string;
  lastUpdate: string;
  internalNotes?: string;
  customerNotes?: string;
  timelineHistory?: Array<{ status: string; date: string; operator: string }>;
}

export interface PriceTier {
  minBuyers: number;
  price: number; // Price in DA for this tier
}

export interface GroupOrderItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  dataAiHint?: string;
  basePrice: number; // Fallback price if no tier is met
  priceTiers: PriceTier[];
  currentBuyers: number;
  storeId: string;
  shareUrl?: string;
}


export interface BusinessLocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  wilaya: string;
  wilayaCode?: string;
  country: string;
  accuracy?: number;
  isLocationPublic: boolean;
  isMobileService: boolean;
  serviceAreaRadius?: number;
  serviceWilayas?: string[];
  updated_at?: string;
}

export interface BaseListing {
  id: string;
  name: string;
  type: ListingType;
  category: string;
  description: string;
  images: string[];
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  location: {
    city: string;
    fullAddress?: string;
    zipCode?: string;
    wilayaCode?: string; // Added wilaya code for filtering
    latitude?: number;
    longitude?: number;
    isLocationPublic?: boolean;
    isMobileService?: boolean;
    serviceAreaRadius?: number;
    serviceWilayas?: string[];
  };
  reviews: Review[];
  averageRating: number;
  pricing?: '$' | '$$' | '$$$' | '$$$$'; // General pricing perception
  servicePrice?: number; // For informational display, not direct booking
  popularity?: number;
  operatingHours?: string;
  dataAiHint?: string;
}

export type StoreSubscriptionPlan = 'basic' | 'pro' | 'premium_annual'; // Added premium_annual for example

export interface Store extends BaseListing {
  type: 'store';
  products?: ProductItem[];
  groupOrderItems?: GroupOrderItem[];
  bannerImageUrl?: string;
  storeLogoUrl?: string;
  isMadeInAlgeria?: boolean;
  subscriptionPlan?: StoreSubscriptionPlan;
}

export interface AppointmentConfig {
  dailyCapacity: number;
  leadTimeDays: number; // Min days in advance for booking
  // timeSlots?: string[]; // e.g., ["09:00-09:30", "10:00-10:30"] - Future
}

export interface Professional extends BaseListing {
  type: 'professional';
  servicesOffered: string[];
  qualifications?: string[];
  verifiedBadges?: VerifiedBadge[];
  standardInstallationPrice?: number; // For specific installation tasks tied to products
  supportsAppointments?: boolean;
  appointmentConfig?: AppointmentConfig;
  clinicLogoUrl?: string; // Optional logo for display in appointment contexts
}

// Types for Digital Services Pillar
export interface DigitalServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  dataAiHint?: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number; // in DA
  deliverables: string[];
}

export interface FreelancerProfile extends BaseListing {
  type: 'freelancer';
  tagline?: string;
  skills: string[];
  portfolio: PortfolioItem[];
  servicePackages: ServicePackage[];
  digitalCategorySlug: string;
}

export interface Hotel extends BaseListing {
  type: 'hotel';
  capacity: number;
  price: number;
  amenities: string[];
}

export interface Dormitory extends BaseListing {
  type: 'dormitory';
  capacity: number;
  price: number;
  amenities: string[];
}

export interface Photographer extends BaseListing {
  type: 'photographer';
  style: string;
  price: number;
}

export type Listing = Store | Professional | FreelancerProfile | Hotel | Dormitory | Photographer;

export interface Category {
  id:string;
  name: string;
  slug: string;
  icon: LucideIcon;
  type: 'store' | 'professional' | 'all';
}

export interface OngoingService {
  id: string;
  serviceName: string;
  providerName: string;
  amountInEscrow: number;
  dateBooked: string; // ISO string
}

// For Login Method Management
export interface LinkedAccountData {
  platform: 'Google' | 'Facebook' | 'X' | 'Phone' | 'Apple' | 'LinkedIn';
  identifier: string; // email for social, phone number for Phone
  isLinked: boolean;
  icon: React.ElementType; // For rendering the icon
}

// Appointment Type
export interface Appointment {
  reservationId: string;
  professionalId: string;
  professionalName: string;
  professionalCategory?: string;
  clinicLogoUrl?: string;
  date: string; // ISO string for the appointment date
  timeSlot?: string; // e.g., "10:00 AM - 10:30 AM" (conceptual for now)
  patientName: string;
  reasonForVisit?: string;
  status: 'pending_confirmation' | 'confirmed' | 'cancelled' | 'completed' | 'en_route' | 'in_progress' | 'waiting_verification' | 'disputed';
  notes?: string; // For the punctuality policy or other info
  location?: string; // Location of the customer
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  memberSince: string;
  isVerified: boolean;
  walletBalance: number;
  ongoingServices: OngoingService[];
  loyaltyPoints?: number;
  isStoreOwner?: boolean;
  storeId?: string;
  isFreelancer?: boolean;
  linkedAccounts?: LinkedAccountData[];
  topUpHistory?: TopUpTransaction[];
  subscriptionPlan?: StoreSubscriptionPlan;
  digitalProjects?: Array<{id: string, name: string, status: string}>;
  appointments?: Appointment[];
}

// Types for "Marketplace" feature (formerly Parts Mine)
export interface PartCategory {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
  description?: string;
}

export type PartCondition = 'used-working' | 'used-good' | 'used-fair-needs-inspection' | 'for-parts-experts-only';

export interface PartRequest {
  id: string;
  userId: string;
  partName: string;
  partDescription: string;
  categorySlug: string;
  deviceModel?: string;
  imageUrls?: string[];
  videoUrl?: string;
  status: 'active' | 'matched' | 'fulfilled' | 'cancelled';
  createdAt: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface ListedPart {
  id: string;
  userId: string;
  partName: string;
  originalDeviceName?: string;
  description: string;
  categorySlug: string;
  price: number;
  condition: PartCondition;
  imageUrls?: string[];
  videoUrl?: string;
  deviceCompatibility?: string[];
  location?: {
    city: string;
    province?: string; // Keep this if used by PartsMine directly, otherwise wilayaCode is more standard
    wilayaCode?: string;
  };
  createdAt: string;
  isSold: boolean;
}

// Cart & Order Types
export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string;
  variantDescription?: string;
  quantity: number;
  unitPrice: number;
  lineItemImage?: string;
  storeId?: string;
}

export interface AlgerianMunicipality {
  code: string;
  name: string; // Arabic name
  name_fr?: string; // French name
  name_en?: string; // English name
  postalCode?: string;
}

export interface AlgerianWilaya {
  code: string;
  name: string; // Arabic name
  name_fr: string; // French name
  name_en: string; // English name
  municipalities?: AlgerianMunicipality[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string; // This would be the municipality name
  wilayaCode: string; // Code of the Wilaya
  postalCode?: string;
}

export interface TopUpTransaction {
  id: string;
  userId: string;
  amount: number;
  method: 'ccp' | 'bank' | 'baridimob' | string;
  status: 'pending-review' | 'approved' | 'rejected' | 'info_required';
  transactionCode: string; // User-provided or system-generated reference
  receiptImageUrl?: string; // Optional URL for uploaded receipt
  createdAt: string; // ISO timestamp
  processedAt?: string; // ISO timestamp
  requestedInfoNote?: string;
  requestedInfoAt?: string;
  userClarificationText?: string;
  userClarificationAttachmentUrl?: string;
  userClarificationFileName?: string;
  userClarificationSubmittedAt?: string;
}

export interface AssistantSuggestion {
  id: string;
  title: string;
  message: string;
  iconName?: keyof typeof import('lucide-react'); // For dynamic icon loading
  actionText?: string;
  actionLink?: string; // Could be internal app route or external URL
  actionType?: 'navigate' | 'call_function'; // How UI should handle action
}

// Dashboard specific conceptual types
export interface ActivityLogItem {
  id: string;
  timestamp: string; // ISO string
  type: 'new_order' | 'customer_registration' | 'product_review' | 'stock_alert';
  description: string;
  link?: string;
}

export interface TopSellingProductItem {
  id: string;
  name: string;
  imageUrl?: string;
  salesCount: number;
  revenue: number;
}

// New Notification Type
export interface NotificationItem {
  id: string;
  type: 'alert' | 'purchase' | 'reservation' | 'system' | 'message'; // Added 'message' for chat
  title: string;
  message: string;
  timestamp: string; // ISO string
  link?: string; // Optional link for navigation
  isRead?: boolean;
  icon?: LucideIcon; // Icon for the notification type
}

// Types for Professional Services Dashboard
export interface ProfessionalVerificationQueueItem {
  id: string;
  professionalName: string;
  professionCategory: string;
  applicationDate: string; // ISO string
  status: 'Pending Verification' | 'Needs More Info' | 'Approved' | 'Rejected';
  assignedTo?: string;
}

export interface ProfessionalActivityStatus {
  total: number;
  active: number;
  inactive: number;
}

export interface ListingApprovalQueueItem {
  listingId: string;
  professionalName: string;
  serviceName: string;
  submittedDate: string; // ISO string
  status: 'Pending Approval' | 'Needs Revision';
}

export interface ServiceCategoryDemand {
  categoryName: string;
  demandScore: number; // e.g., number of searches or views
  supplyScore: number; // e.g., number of professionals
}

export interface UserSearchQuery {
  term: string;
  count: number;
}

export interface SupportTicketSummary {
  id: string;
  ticketNumber: string;
  professionalName: string;
  issueSummary: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  lastUpdate: string; // ISO string
  category?: string; // e.g., "Payment Setup", "Listing Issue"
}

// Type for Top Content (Services/Products) Table
export interface TopContentItem {
  name: string;
  views: number;
  conversionRate: number; // Percentage
}

// Type for Admin Control Panel - User Verification (Enhanced for Platform Super Admin)
export interface AdminVerificationRequestItem {
  id: string;
  applicantName: string; // User or Provider Contact Name
  surname?: string;
  dateOfBirth?: string; // ISO String
  email: string;
  phone?: string;
  requestType: 'Store' | 'Professional'; // To distinguish application type
  entityName?: string; // Business name if 'Store' or Professional name if 'Professional'
  categoryOrPlan: string; // Service category for Professional, or Subscription plan for Store
  submissionDate: string; // ISO string
  status: 'Pending' | 'Approved' | 'Rejected';
  idCardUrl?: string; // Conceptual URL to the ID card PDF/JPG
  commercialRegisterUrl?: string; // Conceptual URL to the Commercial Register PDF/JPG
  // Conceptually, link to documents: documentUrls?: string[];
}

// Type for Super Admin - Platform Store Management
export interface PlatformStore {
    id: string;
    storeName: string;
    ownerName: string;
    ownerId: string;
    applicationDate: string; // ISO string
    subscriptionPlan: StoreSubscriptionPlan;
    subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'pending_payment';
    isActive: boolean; // Platform admin can toggle this
    isFeatured: boolean;
    totalProducts?: number;
    totalSales?: number; // Conceptual
    averageRating?: number; // Added
    location?: { city: string }; // Added
}

// Type for Super Admin - Platform Service Provider Management
export interface PlatformServiceProvider {
    id: string;
    providerName: string; // Could be individual's name or business name
    contactEmail: string;
    serviceCategory: string;
    applicationDate: string; // ISO string
    status: 'active' | 'suspended' | 'pending_review' | 'rejected';
    averageRating?: number;
    totalServicesListed?: number;
    location?: { city: string }; // Added
    totalOrders?: number; // Added
}

// Type for Super Admin - Platform User Management
export type UserRole = 'superadmin' | 'vendor' | 'service_provider' | 'customer';
export interface PlatformUser {
    id: string;
    userName: string;
    email: string;
    role: UserRole;
    registrationDate: string; // ISO string
    status: 'active' | 'banned' | 'pending_verification';
    lastLogin?: string; // ISO string
}

// Conceptual Financial KPI for Super Admin
export interface PlatformFinancialKPI {
    title: string;
    value: string; // e.g., "1,2M DA" or "500"
    trend?: {
        percentage: number;
        direction: 'up' | 'down';
    };
    icon: LucideIcon;
}

export interface BannerItem {
  id: string;
  src: string; // Can be Data URI or regular URL
  alt: string;
  link?: string;
  dataAiHint?: string;
}

export type Language = 'en' | 'ar' | 'fr';

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (key: string, defaultText: string) => string; // Simple translation helper
}

export interface ConversionFunnelData {
  step: string;
  count: number;
  fill?: string;
}

export interface GeographicOrderData {
  wilaya: string;
  count: number;
  total: number;
}

export interface InventoryLog {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  changeQty: number;
  type: 'manual' | 'import' | 'order_deduct' | 'rma_return';
  reason?: string;
  operator: string;
  timestamp: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  orderId: string;
  authorName: string;
  rating: number;
  aspects: {
    product: number;
    seller: number;
    shipping: number;
    packaging: number;
    quality: number;
  };
  comment: string;
  mediaUrls?: string[];
  isVerified: boolean;
  sellerReply?: string;
  reported: boolean;
  date: string;
}

export interface RMARequest {
  id: string;
  orderId: string;
  customerName: string;
  type: 'return' | 'exchange' | 'refund';
  reason: string;
  mediaUrls: string[];
  status: 'requested' | 'under_review' | 'approved' | 'rejected' | 'refunded' | 'replaced';
  history: Array<{ status: string; date: string; note?: string }>;
  date: string;
}

export interface OrderChatMessage {
  id: string;
  sender: 'seller' | 'buyer';
  text: string;
  attachment?: string;
  timestamp: string;
  isRead: boolean;
}
