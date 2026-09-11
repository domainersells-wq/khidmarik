'use client';

import { supabase } from '@/lib/supabase';

/**
 * Khidmatik Platform Administration Data Service
 * Centralized state management, initial data fixtures, local persistence,
 * and CRUD operations for all 23 platform administration modules.
 */

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetId?: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
}

export interface AdminUser {
  id: string;
  userName: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support' | 'finance' | 'store_owner' | 'service_provider' | 'customer' | 'delivery';
  status: 'active' | 'pending_verification' | 'inactive' | 'suspended' | 'banned';
  wilaya: string;
  city: string;
  registrationDate: string;
  lastLogin: string;
  avatarUrl?: string;
  ordersCount: number;
  totalSpent: number;
  notes?: string;
  verifiedEmail: boolean;
  verifiedPhone: boolean;
  twoFactorEnabled: boolean;
  activityHistory?: ActivityLogItem[];
}

export interface AdminProvider {
  id: string;
  providerName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  specialty: string;
  wilaya: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  status: 'active' | 'pending_review' | 'suspended' | 'rejected';
  isVerified: boolean;
  isFeatured: boolean;
  commissionRate: number; // percentage, e.g., 10%
  balance: number; // in DZD
  joinedDate: string;
  identityDocumentStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  identityDocumentType?: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminStore {
  id: string;
  storeName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  category: string;
  wilaya: string;
  address: string;
  subscriptionPlan: 'basic' | 'pro' | 'premium_annual';
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'suspended';
  status: 'active' | 'inactive' | 'pending_review' | 'suspended';
  isFeatured: boolean;
  isVerified: boolean;
  totalSalesCount: number;
  totalRevenue: number; // in DZD
  productCount: number;
  rating: number;
  joinedDate: string;
  commissionRate: number;
  activityHistory?: ActivityLogItem[];
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  storeId: string;
  storeName: string;
  category: string;
  price: number; // in DZD
  compareAtPrice?: number;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock' | 'archived';
  isMadeInAlgeria: boolean;
  imageUrl?: string;
  createdDate: string;
  rating: number;
  salesCount: number;
  description: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminService {
  id: string;
  serviceCode: string;
  title: string;
  providerId: string;
  providerName: string;
  category: string;
  pricingType: 'fixed' | 'hourly' | 'custom_quote';
  basePrice: number; // in DZD
  durationMinutes: number;
  status: 'approved' | 'pending_approval' | 'rejected' | 'paused';
  wilayasCovered: string[];
  totalBookings: number;
  rating: number;
  createdAt: string;
  description: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  storeId: string;
  storeName: string;
  itemsCount: number;
  itemsSummary: string;
  totalAmount: number; // in DZD
  shippingFee: number;
  discountAmount: number;
  paymentMethod: 'edahabia' | 'cib' | 'baridimob' | 'cash_on_delivery' | 'stripe';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  fulfillmentStatus: 'pending' | 'processing' | 'packed' | 'ready_to_ship' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  wilaya: string;
  deliveryAddress: string;
  courier: 'yalidine' | 'procolis' | 'kazi_tour' | 'in_house' | 'store_pickup';
  trackingNumber: string;
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  providerOrVenueName: string;
  type: 'service' | 'banquet_hall' | 'craftsman';
  category: string;
  scheduledDate: string;
  timeSlot: string;
  guestsOrUnits?: number;
  totalPrice: number; // in DZD
  depositPaid: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  wilaya: string;
  address: string;
  createdAt: string;
  otpCode?: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminPayment {
  id: string;
  paymentReference: string;
  orderOrBookingId: string;
  referenceType: 'order' | 'booking' | 'subscription' | 'wallet_topup';
  payerName: string;
  payerPhone: string;
  method: 'edahabia' | 'cib' | 'baridimob' | 'cash_on_delivery' | 'stripe';
  gatewayTransactionId: string;
  amount: number; // in DZD
  currency: 'DZD';
  fee: number;
  netAmount: number;
  status: 'succeeded' | 'processing' | 'failed' | 'refunded';
  timestamp: string;
  ipAddress: string;
}

export interface AdminTransaction {
  id: string;
  referenceId: string;
  type: 'order_payment' | 'service_payout' | 'store_payout' | 'commission_fee' | 'refund' | 'subscription_fee' | 'deposit';
  description: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: number; // in DZD
  flow: 'credit' | 'debit';
  status: 'settled' | 'pending' | 'failed' | 'reversed';
  timestamp: string;
  category: string;
}

export interface AdminCommission {
  id: string;
  categoryName: string;
  entityType: 'store' | 'service' | 'banquet_hall' | 'craftsman';
  defaultRatePercent: number; // e.g. 10%
  minFeeDZD: number;
  maxFeeDZD?: number;
  totalCollectedThisMonth: number;
  totalVolumeProcessed: number;
  isActive: boolean;
  lastUpdated: string;
}

export interface AdminWithdrawal {
  id: string;
  payoutCode: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'store_owner' | 'service_provider';
  bankOrCCP: 'Algérie Poste (CCP)' | 'BNA' | 'BEA' | 'CPA' | 'BDL' | 'BaridiMob';
  accountNumber: string;
  ripNumber: string;
  requestedAmount: number; // in DZD
  processingFee: number;
  netPayoutAmount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
  requestDate: string;
  processedDate?: string;
  processedByAdmin?: string;
  rejectionReason?: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminRefund {
  id: string;
  refundCode: string;
  orderOrBookingNumber: string;
  customerName: string;
  customerEmail: string;
  sellerOrProviderName: string;
  refundAmount: number; // in DZD
  reason: 'product_defect' | 'not_as_described' | 'late_delivery' | 'service_not_delivered' | 'duplicate_charge' | 'other';
  reasonDescription: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedAt: string;
  resolvedAt?: string;
  paymentMethod: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminDispute {
  id: string;
  caseNumber: string;
  title: string;
  initiatorName: string;
  initiatorRole: 'customer' | 'store_owner' | 'service_provider';
  defendantName: string;
  defendantRole: 'customer' | 'store_owner' | 'service_provider';
  referenceType: 'order' | 'booking';
  referenceId: string;
  disputedAmount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'under_investigation' | 'waiting_for_evidence' | 'resolved' | 'escalated';
  createdAt: string;
  lastUpdate: string;
  resolutionSummary?: string;
  mediatorNotes?: string;
  activityHistory?: ActivityLogItem[];
}

export interface AdminReview {
  id: string;
  targetType: 'store' | 'product' | 'service';
  targetId: string;
  targetName: string;
  authorName: string;
  authorEmail: string;
  rating: number; // 1-5
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  status: 'approved' | 'pending' | 'flagged' | 'hidden' | 'deleted';
  flagReason?: string;
  createdAt: string;
  responseFromMerchant?: string;
}

export interface AdminReport {
  id: string;
  reportName: string;
  category: 'financial' | 'sales' | 'users' | 'logistics' | 'inventory';
  format: 'csv' | 'xlsx' | 'pdf';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  generatedDate: string;
  fileSize: string;
  generatedBy: string;
  summaryMetrics: {
    totalRevenue?: number;
    totalOrders?: number;
    newUsers?: number;
    commissionCollected?: number;
  };
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'store_owners' | 'service_providers' | 'customers' | 'delivery_riders' | 'admins';
  channel: 'in_app' | 'push' | 'sms' | 'email';
  status: 'sent' | 'scheduled' | 'draft';
  sentAt?: string;
  scheduledFor?: string;
  deliveredCount: number;
  openedCount: number;
  createdBy: string;
}

export interface AdminMessage {
  id: string;
  conversationId: string;
  senderName: string;
  senderRole: string;
  recipientName: string;
  recipientRole: string;
  subject: string;
  lastMessageSnippet: string;
  unreadCount: number;
  status: 'active' | 'closed' | 'flagged';
  lastActivity: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface AdminCategory {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  slug: string;
  iconName: string;
  type: 'store' | 'professional' | 'craftsman' | 'banquet_hall' | 'spare_parts';
  parentCategoryId?: string;
  itemCount: number;
  displayOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface AdminLocation {
  id: string;
  wilayaCode: string; // e.g. "16", "31", "25"
  nameEn: string;
  nameAr: string;
  nameFr: string;
  communesCount: number;
  shippingZone: 'Zone 1 (Algiers & Coast)' | 'Zone 2 (Central Plains)' | 'Zone 3 (High Plateaus)' | 'Zone 4 (Sahara)';
  baseShippingCost: number; // in DZD
  expressShippingCost: number;
  isDeliveryAvailable: boolean;
  isServiceAvailable: boolean;
  activeCouriers: string[];
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SUSPEND' | 'APPROVE' | 'REFUND' | 'CONFIG_CHANGE';
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  oldValue?: any;
  newValue?: any;
}

// ------------------------------------------------------------------------------------------------
// SEED DATA GENERATORS (Realistic Algerian Super-App context)
// ------------------------------------------------------------------------------------------------

const SEED_USERS: AdminUser[] = [
  { id: 'usr_1', userName: 'Karim Hadjadj', email: 'karim.hadjadj@gmail.com', phone: '+213 550 12 34 56', role: 'super_admin', status: 'active', wilaya: 'Algiers (16)', city: 'Hydra', registrationDate: '2025-11-10', lastLogin: '2026-08-23 08:30', ordersCount: 42, totalSpent: 285000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: true },
  { id: 'usr_2', userName: 'Amina Belkacem', email: 'amina.b@yahoo.fr', phone: '+213 661 98 76 54', role: 'store_owner', status: 'active', wilaya: 'Oran (31)', city: 'Es Senia', registrationDate: '2026-01-15', lastLogin: '2026-08-22 19:40', ordersCount: 12, totalSpent: 74000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: false },
  { id: 'usr_3', userName: 'Sofiane Mansouri', email: 's.mansouri@crafts.dz', phone: '+213 770 45 67 89', role: 'service_provider', status: 'active', wilaya: 'Constantine (25)', city: 'El Khroub', registrationDate: '2026-02-01', lastLogin: '2026-08-23 07:15', ordersCount: 8, totalSpent: 35000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: false },
  { id: 'usr_4', userName: 'Yasmine Taleb', email: 'yasmine.taleb@outlook.com', phone: '+213 540 88 99 00', role: 'customer', status: 'active', wilaya: 'Setif (19)', city: 'El Eulma', registrationDate: '2026-03-12', lastLogin: '2026-08-21 14:20', ordersCount: 19, totalSpent: 142000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: false },
  { id: 'usr_5', userName: 'Nadir Boumedienne', email: 'nadir.delivery@yalidine.dz', phone: '+213 699 33 22 11', role: 'delivery', status: 'active', wilaya: 'Blida (09)', city: 'Boufarik', registrationDate: '2026-04-05', lastLogin: '2026-08-23 06:45', ordersCount: 3, totalSpent: 12500, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: false },
  { id: 'usr_6', userName: 'Mounir Zaidi', email: 'mounir.finance@khidmatik.dz', phone: '+213 555 77 88 99', role: 'finance', status: 'active', wilaya: 'Algiers (16)', city: 'El Biar', registrationDate: '2026-01-08', lastLogin: '2026-08-23 09:00', ordersCount: 5, totalSpent: 45000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: true },
  { id: 'usr_7', userName: 'Walid Brahimi', email: 'suspicious.actor99@tempmail.com', phone: '+213 790 11 22 33', role: 'customer', status: 'suspended', wilaya: 'Annaba (23)', city: 'El Bouni', registrationDate: '2026-06-18', lastLogin: '2026-07-02 22:10', ordersCount: 0, totalSpent: 0, verifiedEmail: false, verifiedPhone: true, twoFactorEnabled: false },
  { id: 'usr_8', userName: 'Fatima Zohra Charef', email: 'fz.charef@gmail.com', phone: '+213 560 44 33 22', role: 'moderator', status: 'active', wilaya: 'Tlemcen (13)', city: 'Mansourah', registrationDate: '2026-02-20', lastLogin: '2026-08-22 16:30', ordersCount: 14, totalSpent: 89000, verifiedEmail: true, verifiedPhone: true, twoFactorEnabled: true },
];

const SEED_PROVIDERS: AdminProvider[] = [
  { id: 'prv_1', providerName: 'Plomberie Express Hadj', ownerName: 'Sofiane Mansouri', email: 'sofiane.plomb@gmail.com', phone: '+213 551 22 33 44', category: 'Plumbing & Heating', specialty: 'Emergency Leak Fix & Boiler Repair', wilaya: 'Algiers (16)', rating: 4.9, reviewCount: 128, completedJobs: 340, status: 'active', isVerified: true, isFeatured: true, commissionRate: 10, balance: 145000, joinedDate: '2025-12-01', identityDocumentStatus: 'verified', identityDocumentType: 'National ID Card (CNI)' },
  { id: 'prv_2', providerName: 'Électricité Pro Dz', ownerName: 'Rachid Khellaf', email: 'rachid.elec@gmail.com', phone: '+213 661 33 44 55', category: 'Electrical & Solar', specialty: '3-Phase Wiring & Inverter Setup', wilaya: 'Oran (31)', rating: 4.8, reviewCount: 86, completedJobs: 210, status: 'active', isVerified: true, isFeatured: true, commissionRate: 10, balance: 89000, joinedDate: '2026-01-10', identityDocumentStatus: 'verified', identityDocumentType: 'National ID Card (CNI)' },
  { id: 'prv_3', providerName: 'Climatisation Atlas', ownerName: 'Hamid Benali', email: 'hamid.clim@gmail.com', phone: '+213 770 44 55 66', category: 'HVAC & Air Conditioning', specialty: 'Split AC Cleaning & Gas Recharge', wilaya: 'Blida (09)', rating: 4.7, reviewCount: 52, completedJobs: 145, status: 'active', isVerified: true, isFeatured: false, commissionRate: 12, balance: 62000, joinedDate: '2026-02-18', identityDocumentStatus: 'verified', identityDocumentType: 'Driver License' },
  { id: 'prv_4', providerName: 'Menuiserie Bois & Aluminium', ownerName: 'Abdelkader Djaid', email: 'djaid.bois@gmail.com', phone: '+213 540 55 66 77', category: 'Carpentry & Windows', specialty: 'Custom Kitchen Cabinets & PVC Windows', wilaya: 'Constantine (25)', rating: 4.6, reviewCount: 39, completedJobs: 98, status: 'active', isVerified: true, isFeatured: false, commissionRate: 10, balance: 112000, joinedDate: '2026-03-05', identityDocumentStatus: 'verified', identityDocumentType: 'National ID Card (CNI)' },
  { id: 'prv_5', providerName: 'Peinture & Décoration Moderne', ownerName: 'Farid Mehdaoui', email: 'farid.peintre@gmail.com', phone: '+213 699 66 77 88', category: 'Painting & Finishing', specialty: 'Stucco, Ferrara, and Epoxy Floors', wilaya: 'Setif (19)', rating: 4.5, reviewCount: 24, completedJobs: 65, status: 'pending_review', isVerified: false, isFeatured: false, commissionRate: 12, balance: 0, joinedDate: '2026-07-28', identityDocumentStatus: 'pending', identityDocumentType: 'Trade Certificate & ID' },
  { id: 'prv_6', providerName: 'Auto Dépannage 24/7', ownerName: 'Tarek Cherif', email: 'tarek.remorquage@gmail.com', phone: '+213 555 88 99 00', category: 'Automotive & Towing', specialty: 'Roadside Assistance & Towing Truck', wilaya: 'Boumerdes (35)', rating: 4.9, reviewCount: 110, completedJobs: 280, status: 'active', isVerified: true, isFeatured: true, commissionRate: 8, balance: 178000, joinedDate: '2026-01-05', identityDocumentStatus: 'verified', identityDocumentType: 'Commercial Register (RC)' },
];

const SEED_STORES: AdminStore[] = [
  { id: 'str_1', storeName: 'DzTech Electronics Store', slug: 'dztech-electronics', ownerName: 'Amina Belkacem', ownerEmail: 'amina.dztech@gmail.com', ownerPhone: '+213 550 11 22 33', category: 'Electronics & Computers', wilaya: 'Algiers (16)', address: 'Rue Didouche Mourad, Alger Centre', subscriptionPlan: 'premium_annual', subscriptionStatus: 'active', status: 'active', isFeatured: true, isVerified: true, totalSalesCount: 890, totalRevenue: 14500000, productCount: 142, rating: 4.9, joinedDate: '2025-10-15', commissionRate: 8 },
  { id: 'str_2', storeName: 'Maison & Décor El Bahia', slug: 'maison-decor-oran', ownerName: 'Mustapha Touati', ownerEmail: 'touati.decor@gmail.com', ownerPhone: '+213 661 22 33 44', category: 'Home & Furniture', wilaya: 'Oran (31)', address: 'Boulevard Akid Lotfi', subscriptionPlan: 'pro', subscriptionStatus: 'active', status: 'active', isFeatured: true, isVerified: true, totalSalesCount: 420, totalRevenue: 8900000, productCount: 85, rating: 4.8, joinedDate: '2025-11-20', commissionRate: 10 },
  { id: 'str_3', storeName: 'Pièces Auto Express Algérie', slug: 'pieces-auto-express', ownerName: 'Bilal Messaoudi', ownerEmail: 'bilal.auto@gmail.com', ownerPhone: '+213 770 33 44 55', category: 'Auto Spare Parts', wilaya: 'Batna (05)', address: 'Zone Industrielle Batna', subscriptionPlan: 'pro', subscriptionStatus: 'active', status: 'active', isFeatured: false, isVerified: true, totalSalesCount: 650, totalRevenue: 11200000, productCount: 320, rating: 4.7, joinedDate: '2026-01-04', commissionRate: 9 },
  { id: 'str_4', storeName: 'Cosmétique & Beauté Naturelle', slug: 'cosmetique-naturelle', ownerName: 'Lilia Amrani', ownerEmail: 'lilia.cosm@gmail.com', ownerPhone: '+213 540 44 55 66', category: 'Beauty & Health', wilaya: 'Tizi Ouzou (15)', address: 'Avenue Abane Ramdane', subscriptionPlan: 'basic', subscriptionStatus: 'active', status: 'active', isFeatured: false, isVerified: true, totalSalesCount: 180, totalRevenue: 2400000, productCount: 45, rating: 4.6, joinedDate: '2026-02-12', commissionRate: 12 },
  { id: 'str_5', storeName: 'Outillage & Bricolage Pro', slug: 'outillage-bricolage-pro', ownerName: 'Hocine Zerrouki', ownerEmail: 'zerrouki.tools@gmail.com', ownerPhone: '+213 699 55 66 77', category: 'Hardware & Tools', wilaya: 'Setif (19)', address: 'Zone Commerciale El Eulma', subscriptionPlan: 'pro', subscriptionStatus: 'active', status: 'active', isFeatured: true, isVerified: true, totalSalesCount: 510, totalRevenue: 9800000, productCount: 215, rating: 4.8, joinedDate: '2026-01-25', commissionRate: 9 },
  { id: 'str_6', storeName: 'Mode Traditionnelle & Moderne', slug: 'mode-traditionnelle-dz', ownerName: 'Salima Kaci', ownerEmail: 'salima.mode@gmail.com', ownerPhone: '+213 555 66 77 88', category: 'Fashion & Clothing', wilaya: 'Constantine (25)', address: 'Centre Commercial La Brèche', subscriptionPlan: 'basic', subscriptionStatus: 'trial', status: 'active', isFeatured: false, isVerified: false, totalSalesCount: 65, totalRevenue: 1350000, productCount: 38, rating: 4.4, joinedDate: '2026-06-10', commissionRate: 12 },
];

const SEED_PRODUCTS: AdminProduct[] = [
  { id: 'prd_1', sku: 'DZT-LAP-001', name: 'Lenovo ThinkPad Core i7 16GB 512GB SSD', slug: 'lenovo-thinkpad-core-i7', storeId: 'str_1', storeName: 'DzTech Electronics Store', category: 'Electronics & Computers', price: 115000, compareAtPrice: 125000, stock: 18, status: 'active', isMadeInAlgeria: false, createdDate: '2026-02-10', rating: 4.9, salesCount: 42, description: 'High performance laptop suitable for enterprise and development.' },
  { id: 'prd_2', sku: 'DZT-PHN-002', name: 'Samsung Galaxy A55 5G 256GB Dual SIM', slug: 'samsung-galaxy-a55-5g', storeId: 'str_1', storeName: 'DzTech Electronics Store', category: 'Electronics & Computers', price: 68500, compareAtPrice: 72000, stock: 35, status: 'active', isMadeInAlgeria: false, createdDate: '2026-03-01', rating: 4.8, salesCount: 88, description: 'Official warranty with fast charging adapter included.' },
  { id: 'prd_3', sku: 'AUT-BRK-003', name: 'Plaquettes de Frein Avant Renault Clio 4 / Symbol', slug: 'plaquettes-frein-renault-clio-4', storeId: 'str_3', storeName: 'Pièces Auto Express Algérie', category: 'Auto Spare Parts', price: 4200, compareAtPrice: 5000, stock: 120, status: 'active', isMadeInAlgeria: false, createdDate: '2026-01-15', rating: 4.7, salesCount: 215, description: 'Original Valeo braking pads for optimal road safety.' },
  { id: 'prd_4', sku: 'AUT-FLT-004', name: 'Kit Filtration Complet (Huile + Air + Carburant) Duster 1.5 dCi', slug: 'kit-filtration-duster-1-5-dci', storeId: 'str_3', storeName: 'Pièces Auto Express Algérie', category: 'Auto Spare Parts', price: 7800, compareAtPrice: 8500, stock: 45, status: 'active', isMadeInAlgeria: false, createdDate: '2026-02-20', rating: 4.9, salesCount: 160, description: 'OEM quality filters for longevity and engine protection.' },
  { id: 'prd_5', sku: 'TOOL-DRL-005', name: 'Perceuse Visseuse Sans Fil Bosch 18V avec 2 Batteries', slug: 'perceuse-visseuse-bosch-18v', storeId: 'str_5', storeName: 'Outillage & Bricolage Pro', category: 'Hardware & Tools', price: 24500, compareAtPrice: 27000, stock: 22, status: 'active', isMadeInAlgeria: false, createdDate: '2026-02-28', rating: 4.9, salesCount: 65, description: 'Professional heavy duty tool with carry case.' },
  { id: 'prd_6', sku: 'DEC-ROU-006', name: 'Tapis Artisanal Berbère Pur Laine Fait Main 2x3m', slug: 'tapis-artisanal-berbere-laine', storeId: 'str_2', storeName: 'Maison & Décor El Bahia', category: 'Home & Furniture', price: 38000, compareAtPrice: 45000, stock: 6, status: 'active', isMadeInAlgeria: true, createdDate: '2026-04-12', rating: 5.0, salesCount: 14, description: 'Authentic handmade Algerian sheep wool carpet with geometric motifs.' },
  { id: 'prd_7', sku: 'COS-HUI-007', name: 'Huile de Figue de Barbarie Pure Bio 50ml', slug: 'huile-figue-barbarie-bio', storeId: 'str_4', storeName: 'Cosmétique & Beauté Naturelle', category: 'Beauty & Health', price: 4500, stock: 80, status: 'active', isMadeInAlgeria: true, createdDate: '2026-05-02', rating: 4.8, salesCount: 95, description: '100% natural cold pressed anti-aging serum from Algerian producers.' },
];

const SEED_SERVICES: AdminService[] = [
  { id: 'srv_1', serviceCode: 'SRV-PLM-01', title: 'Recherche et Réparation de Fuite d\'Eau Urgente', providerId: 'prv_1', providerName: 'Plomberie Express Hadj', category: 'Plumbing & Heating', pricingType: 'fixed', basePrice: 4500, durationMinutes: 90, status: 'approved', wilayasCovered: ['Algiers (16)', 'Blida (09)', 'Tipaza (42)', 'Boumerdes (35)'], totalBookings: 180, rating: 4.9, createdAt: '2026-01-10', description: 'Thermal camera leak detection and instant pipe replacement.' },
  { id: 'srv_2', serviceCode: 'SRV-ELC-02', title: 'Installation Tableau Électrique & Mise aux Normes', providerId: 'prv_2', providerName: 'Électricité Pro Dz', category: 'Electrical & Solar', pricingType: 'fixed', basePrice: 12000, durationMinutes: 180, status: 'approved', wilayasCovered: ['Oran (31)', 'Mostaganem (27)', 'Sidi Bel Abbès (22)'], totalBookings: 95, rating: 4.8, createdAt: '2026-01-20', description: 'Full circuit breaker installation with earthing measurement.' },
  { id: 'srv_3', serviceCode: 'SRV-CLM-03', title: 'Nettoyage & Recharge Gaz Climatiseur Split', providerId: 'prv_3', providerName: 'Climatisation Atlas', category: 'HVAC & Air Conditioning', pricingType: 'fixed', basePrice: 5000, durationMinutes: 60, status: 'approved', wilayasCovered: ['Blida (09)', 'Algiers (16)', 'Medea (26)'], totalBookings: 140, rating: 4.7, createdAt: '2026-03-01', description: 'Antibacterial coil deep wash and R410A / R32 pressure top-up.' },
  { id: 'srv_4', serviceCode: 'SRV-HAL-04', title: 'Location Salle des Fêtes Palais El Djazair (500 Personnes)', providerId: 'prv_1', providerName: 'Palais El Djazair Events', category: 'Banquet Halls & Events', pricingType: 'fixed', basePrice: 280000, durationMinutes: 480, status: 'approved', wilayasCovered: ['Algiers (16)'], totalBookings: 28, rating: 4.9, createdAt: '2025-11-15', description: 'Luxury banquet venue including sound system, bridal suite, and parking.' },
  { id: 'srv_5', serviceCode: 'SRV-DEC-05', title: 'Pose Carrelage & Faïence Céramique Grand Format', providerId: 'prv_5', providerName: 'Peinture & Décoration Moderne', category: 'Painting & Finishing', pricingType: 'hourly', basePrice: 1500, durationMinutes: 60, status: 'pending_approval', wilayasCovered: ['Setif (19)', 'Bordj Bou Arreridj (34)'], totalBookings: 0, rating: 0, createdAt: '2026-08-15', description: 'High precision leveling system for porcelain slabs.' },
];

const SEED_ORDERS: AdminOrder[] = [
  { id: 'ord_1', orderNumber: 'KHD-ORD-2026-8801', customerId: 'usr_4', customerName: 'Yasmine Taleb', customerPhone: '+213 540 88 99 00', customerEmail: 'yasmine.taleb@outlook.com', storeId: 'str_1', storeName: 'DzTech Electronics Store', itemsCount: 1, itemsSummary: 'Lenovo ThinkPad Core i7', totalAmount: 115000, shippingFee: 800, discountAmount: 0, paymentMethod: 'edahabia', paymentStatus: 'paid', fulfillmentStatus: 'shipped', wilaya: 'Setif (19)', deliveryAddress: 'Cité 1000 Logements, Bâtiment C, Setif', courier: 'yalidine', trackingNumber: 'YAL-DZ-8941029', orderDate: '2026-08-22 10:14', notes: 'Call before delivery please.' },
  { id: 'ord_2', orderNumber: 'KHD-ORD-2026-8802', customerId: 'usr_1', customerName: 'Karim Hadjadj', customerPhone: '+213 550 12 34 56', customerEmail: 'karim.hadjadj@gmail.com', storeId: 'str_3', storeName: 'Pièces Auto Express Algérie', itemsCount: 2, itemsSummary: 'Plaquettes de Frein + Kit Filtration', totalAmount: 12000, shippingFee: 600, discountAmount: 500, paymentMethod: 'baridimob', paymentStatus: 'paid', fulfillmentStatus: 'delivered', wilaya: 'Algiers (16)', deliveryAddress: 'Hydra, Val d\'Hydra Villa 14', courier: 'yalidine', trackingNumber: 'YAL-DZ-7741201', orderDate: '2026-08-21 16:30', deliveryDate: '2026-08-22 14:00' },
  { id: 'ord_3', orderNumber: 'KHD-ORD-2026-8803', customerId: 'usr_2', customerName: 'Amina Belkacem', customerPhone: '+213 661 98 76 54', customerEmail: 'amina.b@yahoo.fr', storeId: 'str_5', storeName: 'Outillage & Bricolage Pro', itemsCount: 1, itemsSummary: 'Perceuse Visseuse Sans Fil Bosch', totalAmount: 24500, shippingFee: 900, discountAmount: 0, paymentMethod: 'cash_on_delivery', paymentStatus: 'pending', fulfillmentStatus: 'processing', wilaya: 'Oran (31)', deliveryAddress: 'Boulevard Akid Lotfi, Oran', courier: 'procolis', trackingNumber: 'PRC-OR-33019', orderDate: '2026-08-23 08:15' },
  { id: 'ord_4', orderNumber: 'KHD-ORD-2026-8804', customerId: 'usr_7', customerName: 'Walid Brahimi', customerPhone: '+213 790 11 22 33', customerEmail: 'suspicious.actor99@tempmail.com', storeId: 'str_1', storeName: 'DzTech Electronics Store', itemsCount: 2, itemsSummary: 'Samsung Galaxy A55 5G x2', totalAmount: 137000, shippingFee: 1200, discountAmount: 0, paymentMethod: 'cib', paymentStatus: 'failed', fulfillmentStatus: 'cancelled', wilaya: 'Annaba (23)', deliveryAddress: 'Centre Ville Annaba', courier: 'yalidine', trackingNumber: 'CANCELLED', orderDate: '2026-08-20 23:45', notes: 'Payment gateway rejected 3DS authentication.' },
  { id: 'ord_5', orderNumber: 'KHD-ORD-2026-8805', customerId: 'usr_4', customerName: 'Yasmine Taleb', customerPhone: '+213 540 88 99 00', customerEmail: 'yasmine.taleb@outlook.com', storeId: 'str_2', storeName: 'Maison & Décor El Bahia', itemsCount: 1, itemsSummary: 'Tapis Artisanal Berbère Pur Laine', totalAmount: 38000, shippingFee: 1500, discountAmount: 1000, paymentMethod: 'edahabia', paymentStatus: 'paid', fulfillmentStatus: 'completed', wilaya: 'Setif (19)', deliveryAddress: 'Cité 1000 Logements, Setif', courier: 'yalidine', trackingNumber: 'YAL-DZ-6619022', orderDate: '2026-08-18 11:20', deliveryDate: '2026-08-20 17:30' },
];

const SEED_BOOKINGS: AdminBooking[] = [
  { id: 'bkg_1', bookingCode: 'BKG-2026-901', customerName: 'Karim Hadjadj', customerPhone: '+213 550 12 34 56', customerEmail: 'karim.hadjadj@gmail.com', providerOrVenueName: 'Palais El Djazair Events', type: 'banquet_hall', category: 'Banquet Halls & Events', scheduledDate: '2026-09-18', timeSlot: '18:00 - 02:00', guestsOrUnits: 350, totalPrice: 280000, depositPaid: 100000, status: 'confirmed', wilaya: 'Algiers (16)', address: 'El Biar, Alger', createdAt: '2026-08-10', otpCode: '849201' },
  { id: 'bkg_2', bookingCode: 'BKG-2026-902', customerName: 'Yasmine Taleb', customerPhone: '+213 540 88 99 00', customerEmail: 'yasmine.taleb@outlook.com', providerOrVenueName: 'Plomberie Express Hadj', type: 'craftsman', category: 'Plumbing & Heating', scheduledDate: '2026-08-24', timeSlot: '10:00 - 12:00', totalPrice: 4500, depositPaid: 4500, status: 'confirmed', wilaya: 'Algiers (16)', address: 'Kouba Centre', createdAt: '2026-08-22', otpCode: '194022' },
  { id: 'bkg_3', bookingCode: 'BKG-2026-903', customerName: 'Sofiane Mansouri', customerPhone: '+213 770 45 67 89', customerEmail: 's.mansouri@crafts.dz', providerOrVenueName: 'Électricité Pro Dz', type: 'craftsman', category: 'Electrical & Solar', scheduledDate: '2026-08-25', timeSlot: '14:00 - 17:00', totalPrice: 12000, depositPaid: 3000, status: 'pending', wilaya: 'Oran (31)', address: 'Maraval, Oran', createdAt: '2026-08-23', otpCode: '772910' },
  { id: 'bkg_4', bookingCode: 'BKG-2026-904', customerName: 'Amina Belkacem', customerPhone: '+213 661 98 76 54', customerEmail: 'amina.b@yahoo.fr', providerOrVenueName: 'Climatisation Atlas', type: 'service', category: 'HVAC & Air Conditioning', scheduledDate: '2026-08-20', timeSlot: '09:00 - 10:30', totalPrice: 5000, depositPaid: 5000, status: 'completed', wilaya: 'Blida (09)', address: 'Ouled Yaich', createdAt: '2026-08-17', otpCode: '331890' },
];

const SEED_PAYMENTS: AdminPayment[] = [
  { id: 'pay_1', paymentReference: 'PAY-EDH-99201', orderOrBookingId: 'KHD-ORD-2026-8801', referenceType: 'order', payerName: 'Yasmine Taleb', payerPhone: '+213 540 88 99 00', method: 'edahabia', gatewayTransactionId: 'SATIM_TX_881920384', amount: 115800, currency: 'DZD', fee: 2316, netAmount: 113484, status: 'succeeded', timestamp: '2026-08-22 10:15', ipAddress: '105.101.44.12' },
  { id: 'pay_2', paymentReference: 'PAY-BM-99202', orderOrBookingId: 'KHD-ORD-2026-8802', referenceType: 'order', payerName: 'Karim Hadjadj', payerPhone: '+213 550 12 34 56', method: 'baridimob', gatewayTransactionId: 'BM_P2P_77192834', amount: 12100, currency: 'DZD', fee: 150, netAmount: 11950, status: 'succeeded', timestamp: '2026-08-21 16:32', ipAddress: '105.98.12.80' },
  { id: 'pay_3', paymentReference: 'PAY-EDH-99203', orderOrBookingId: 'BKG-2026-901', referenceType: 'booking', payerName: 'Karim Hadjadj', payerPhone: '+213 550 12 34 56', method: 'edahabia', gatewayTransactionId: 'SATIM_TX_66190284', amount: 100000, currency: 'DZD', fee: 2000, netAmount: 98000, status: 'succeeded', timestamp: '2026-08-10 14:22', ipAddress: '105.98.12.80' },
  { id: 'pay_4', paymentReference: 'PAY-CIB-99204', orderOrBookingId: 'KHD-ORD-2026-8804', referenceType: 'order', payerName: 'Walid Brahimi', payerPhone: '+213 790 11 22 33', method: 'cib', gatewayTransactionId: 'SATIM_ERR_05_DECLINED', amount: 138200, currency: 'DZD', fee: 0, netAmount: 0, status: 'failed', timestamp: '2026-08-20 23:46', ipAddress: '41.111.90.3' },
];

const SEED_TRANSACTIONS: AdminTransaction[] = [
  { id: 'txn_1', referenceId: 'TXN-2026-001', type: 'order_payment', description: 'Order KHD-ORD-2026-8801 customer payment via Edahabia', sourceAccount: 'SATIM Gateway', destinationAccount: 'Khidmatik Platform Vault', amount: 115800, flow: 'credit', status: 'settled', timestamp: '2026-08-22 10:15', category: 'Customer Order' },
  { id: 'txn_2', referenceId: 'TXN-2026-002', type: 'commission_fee', description: 'Platform Commission (8%) for DzTech Electronics', sourceAccount: 'DzTech Pending Escrow', destinationAccount: 'Khidmatik Revenue Account', amount: 9200, flow: 'credit', status: 'settled', timestamp: '2026-08-22 10:16', category: 'Platform Fee' },
  { id: 'txn_3', referenceId: 'TXN-2026-003', type: 'store_payout', description: 'Weekly settlement to DzTech Electronics Store CCP', sourceAccount: 'Khidmatik Payout Vault', destinationAccount: 'CCP 001892019 Clé 45', amount: 250000, flow: 'debit', status: 'settled', timestamp: '2026-08-20 11:00', category: 'Payout' },
  { id: 'txn_4', referenceId: 'TXN-2026-004', type: 'service_payout', description: 'Craftsman Payout to Sofiane Mansouri (Plumbing)', sourceAccount: 'Khidmatik Payout Vault', destinationAccount: 'BaridiMob 007999990001', amount: 45000, flow: 'debit', status: 'settled', timestamp: '2026-08-19 14:30', category: 'Payout' },
  { id: 'txn_5', referenceId: 'TXN-2026-005', type: 'refund', description: 'Refund for damaged parcel return KHD-ORD-2026-8790', sourceAccount: 'Khidmatik Platform Vault', destinationAccount: 'Customer Edahabia Card', amount: 8500, flow: 'debit', status: 'settled', timestamp: '2026-08-18 09:10', category: 'Customer Refund' },
];

const SEED_COMMISSIONS: AdminCommission[] = [
  { id: 'comm_1', categoryName: 'Electronics & Computers', entityType: 'store', defaultRatePercent: 8, minFeeDZD: 300, maxFeeDZD: 15000, totalCollectedThisMonth: 890000, totalVolumeProcessed: 11125000, isActive: true, lastUpdated: '2026-08-01' },
  { id: 'comm_2', categoryName: 'Auto Spare Parts', entityType: 'store', defaultRatePercent: 9, minFeeDZD: 200, maxFeeDZD: 12000, totalCollectedThisMonth: 640000, totalVolumeProcessed: 7111000, isActive: true, lastUpdated: '2026-08-01' },
  { id: 'comm_3', categoryName: 'Home & Furniture', entityType: 'store', defaultRatePercent: 10, minFeeDZD: 500, maxFeeDZD: 20000, totalCollectedThisMonth: 480000, totalVolumeProcessed: 4800000, isActive: true, lastUpdated: '2026-08-01' },
  { id: 'comm_4', categoryName: 'Plumbing & Craftsmen Services', entityType: 'craftsman', defaultRatePercent: 10, minFeeDZD: 250, totalCollectedThisMonth: 320000, totalVolumeProcessed: 3200000, isActive: true, lastUpdated: '2026-08-01' },
  { id: 'comm_5', categoryName: 'Banquet Halls & Events', entityType: 'banquet_hall', defaultRatePercent: 5, minFeeDZD: 5000, maxFeeDZD: 30000, totalCollectedThisMonth: 750000, totalVolumeProcessed: 15000000, isActive: true, lastUpdated: '2026-08-01' },
  { id: 'comm_6', categoryName: 'Beauty & Health', entityType: 'store', defaultRatePercent: 12, minFeeDZD: 150, totalCollectedThisMonth: 180000, totalVolumeProcessed: 1500000, isActive: true, lastUpdated: '2026-08-01' },
];

const SEED_WITHDRAWALS: AdminWithdrawal[] = [
  { id: 'wth_1', payoutCode: 'WTH-2026-4401', recipientId: 'str_1', recipientName: 'DzTech Electronics (Amina Belkacem)', recipientType: 'store_owner', bankOrCCP: 'Algérie Poste (CCP)', accountNumber: '001892019 Clé 45', ripNumber: '0079999900189201945', requestedAmount: 380000, processingFee: 0, netPayoutAmount: 380000, status: 'pending', requestDate: '2026-08-22 18:00' },
  { id: 'wth_2', payoutCode: 'WTH-2026-4402', recipientId: 'prv_1', recipientName: 'Plomberie Express (Sofiane Mansouri)', recipientType: 'service_provider', bankOrCCP: 'BaridiMob', accountNumber: '007999990001', ripNumber: '00799999007999990012', requestedAmount: 65000, processingFee: 0, netPayoutAmount: 65000, status: 'approved', requestDate: '2026-08-21 09:30', processedDate: '2026-08-22 11:00', processedByAdmin: 'Mounir Zaidi' },
  { id: 'wth_3', payoutCode: 'WTH-2026-4403', recipientId: 'str_3', recipientName: 'Pièces Auto Express (Bilal Messaoudi)', recipientType: 'store_owner', bankOrCCP: 'BNA', accountNumber: '00100 45000 12345 67', ripNumber: '00100450001234567890', requestedAmount: 210000, processingFee: 0, netPayoutAmount: 210000, status: 'processing', requestDate: '2026-08-23 07:45' },
  { id: 'wth_4', payoutCode: 'WTH-2026-4404', recipientId: 'prv_2', recipientName: 'Électricité Pro Dz (Rachid Khellaf)', recipientType: 'service_provider', bankOrCCP: 'Algérie Poste (CCP)', accountNumber: '009841203 Clé 88', ripNumber: '0079999900984120388', requestedAmount: 42000, processingFee: 0, netPayoutAmount: 42000, status: 'completed', requestDate: '2026-08-15 14:00', processedDate: '2026-08-16 10:20', processedByAdmin: 'Mounir Zaidi' },
];

const SEED_REFUNDS: AdminRefund[] = [
  { id: 'ref_1', refundCode: 'REF-2026-101', orderOrBookingNumber: 'KHD-ORD-2026-8790', customerName: 'Mourad Saidi', customerEmail: 'mourad.saidi@gmail.com', sellerOrProviderName: 'Pièces Auto Express Algérie', refundAmount: 8500, reason: 'product_defect', reasonDescription: 'Brake cylinder size did not match car model specifications.', status: 'processed', requestedAt: '2026-08-17 11:00', resolvedAt: '2026-08-18 09:10', paymentMethod: 'Edahabia' },
  { id: 'ref_2', refundCode: 'REF-2026-102', orderOrBookingNumber: 'BKG-2026-888', customerName: 'Samir Kerbouche', customerEmail: 'samir.kerb@yahoo.fr', sellerOrProviderName: 'Menuiserie Bois & Aluminium', refundAmount: 15000, reason: 'service_not_delivered', reasonDescription: 'Provider was unavailable on the agreed appointment date due to emergency.', status: 'pending', requestedAt: '2026-08-22 15:30', paymentMethod: 'BaridiMob' },
  { id: 'ref_3', refundCode: 'REF-2026-103', orderOrBookingNumber: 'KHD-ORD-2026-8742', customerName: 'Nadia Bensalem', customerEmail: 'nadia.b@gmail.com', sellerOrProviderName: 'DzTech Electronics Store', refundAmount: 12500, reason: 'not_as_described', reasonDescription: 'Wireless headset had cosmetic scratches out of the box.', status: 'approved', requestedAt: '2026-08-21 18:40', resolvedAt: '2026-08-22 14:00', paymentMethod: 'Edahabia' },
];

const SEED_DISPUTES: AdminDispute[] = [
  { id: 'dsp_1', caseNumber: 'DSP-2026-501', title: 'Package arrived with broken LCD screen', initiatorName: 'Amine Ferhani', initiatorRole: 'customer', defendantName: 'DzTech Electronics Store', defendantRole: 'store_owner', referenceType: 'order', referenceId: 'KHD-ORD-2026-8775', disputedAmount: 32000, priority: 'high', status: 'under_investigation', createdAt: '2026-08-21 12:00', lastUpdate: '2026-08-22 16:45', mediatorNotes: 'Yalidine delivery confirmation shows box damage upon arrival. Contacted insurance.' },
  { id: 'dsp_2', caseNumber: 'DSP-2026-502', title: 'Craftsman did not complete electrical wiring for kitchen', initiatorName: 'Leila Dahmani', initiatorRole: 'customer', defendantName: 'Électricité Pro Dz', defendantRole: 'service_provider', referenceType: 'booking', referenceId: 'BKG-2026-890', disputedAmount: 18000, priority: 'medium', status: 'waiting_for_evidence', createdAt: '2026-08-20 09:30', lastUpdate: '2026-08-21 11:20', mediatorNotes: 'Requested photo evidence of the incomplete electrical panel from client.' },
  { id: 'dsp_3', caseNumber: 'DSP-2026-503', title: 'Banquet hall deposit refund disagreement for date shift', initiatorName: 'Hocine Meziani', initiatorRole: 'customer', defendantName: 'Palais El Djazair Events', defendantRole: 'service_provider', referenceType: 'booking', referenceId: 'BKG-2026-860', disputedAmount: 50000, priority: 'urgent', status: 'open', createdAt: '2026-08-23 08:00', lastUpdate: '2026-08-23 08:00' },
];

const SEED_REVIEWS: AdminReview[] = [
  { id: 'rev_1', targetType: 'store', targetId: 'str_1', targetName: 'DzTech Electronics Store', authorName: 'Yasmine Taleb', authorEmail: 'yasmine.taleb@outlook.com', rating: 5, comment: 'Exceptional service and super fast Yalidine delivery! Laptop was brand new and sealed.', sentiment: 'positive', status: 'approved', createdAt: '2026-08-22 14:00' },
  { id: 'rev_2', targetType: 'service', targetId: 'srv_1', targetName: 'Recherche et Réparation de Fuite d\'Eau', authorName: 'Karim Hadjadj', authorEmail: 'karim.hadjadj@gmail.com', rating: 5, comment: 'Plombier très compétent avec caméra thermique. A résolu la fuite en moins d\'une heure sans casser tout le mur.', sentiment: 'positive', status: 'approved', createdAt: '2026-08-21 17:30' },
  { id: 'rev_3', targetType: 'product', targetId: 'prd_3', targetName: 'Plaquettes de Frein Avant Renault Clio 4', authorName: 'Tarek Cherif', authorEmail: 'tarek.remorquage@gmail.com', rating: 5, comment: 'Pièce d\'origine Valeo, freinage impeccable. Je recommande ce vendeur.', sentiment: 'positive', status: 'approved', createdAt: '2026-08-19 11:15' },
  { id: 'rev_4', targetType: 'store', targetId: 'str_4', targetName: 'Cosmétique & Beauté Naturelle', authorName: 'SpamBot99', authorEmail: 'promo@free-followers.xyz', rating: 1, comment: 'Visit our website for free crypto and followers! Click link http://scam.ru', sentiment: 'negative', status: 'flagged', flagReason: 'Automated spam & link injection', createdAt: '2026-08-23 03:22' },
  { id: 'rev_5', targetType: 'service', targetId: 'srv_3', targetName: 'Nettoyage & Recharge Gaz Climatiseur', authorName: 'Amina Belkacem', authorEmail: 'amina.b@yahoo.fr', rating: 4, comment: 'Bon travail, technicien ponctuel et propre. Climatiseur souffle du froid à nouveau.', sentiment: 'positive', status: 'approved', createdAt: '2026-08-20 18:00' },
];

const SEED_REPORTS: AdminReport[] = [
  { id: 'rep_1', reportName: 'Monthly Financial & Revenue Statement - July 2026', category: 'financial', format: 'xlsx', period: 'monthly', generatedDate: '2026-08-01 02:00', fileSize: '2.4 MB', generatedBy: 'System Cron', summaryMetrics: { totalRevenue: 34200000, commissionCollected: 3120000, totalOrders: 1840, newUsers: 520 } },
  { id: 'rep_2', reportName: 'Wilaya Sales & Logistics Distribution Report', category: 'logistics', format: 'csv', period: 'monthly', generatedDate: '2026-08-01 02:15', fileSize: '850 KB', generatedBy: 'System Cron', summaryMetrics: { totalOrders: 1840 } },
  { id: 'rep_3', reportName: 'Craftsmen & Service Providers Performance Audit', category: 'sales', format: 'csv', period: 'quarterly', generatedDate: '2026-07-01 00:00', fileSize: '1.2 MB', generatedBy: 'Fatima Zohra Charef', summaryMetrics: { totalRevenue: 12800000 } },
  { id: 'rep_4', reportName: 'Quarterly User Growth & Retention Metrics Q2 2026', category: 'users', format: 'pdf', period: 'quarterly', generatedDate: '2026-07-05 10:00', fileSize: '4.1 MB', generatedBy: 'Karim Hadjadj', summaryMetrics: { newUsers: 1450 } },
];

const SEED_NOTIFICATIONS: AdminNotification[] = [
  { id: 'notif_1', title: 'Eid Mubarak Promotion Campaign - Up to 20% Off', message: 'Celebrate with exclusive deals across all stores and artisanal services in Algeria.', targetAudience: 'all', channel: 'push', status: 'sent', sentAt: '2026-06-15 09:00', deliveredCount: 14500, openedCount: 8200, createdBy: 'Karim Hadjadj' },
  { id: 'notif_2', title: 'Nouvelle Fonctionnalité: Paiement BaridiMob Instantané', message: 'Vous pouvez désormais payer et recevoir vos gains directement via votre compte BaridiMob.', targetAudience: 'all', channel: 'in_app', status: 'sent', sentAt: '2026-08-10 11:00', deliveredCount: 18200, openedCount: 11400, createdBy: 'Karim Hadjadj' },
  { id: 'notif_3', title: 'Rappel: Mise à jour des coordonnées CCP pour virement hebdomadaire', message: 'Veuillez vérifier votre numéro RIP dans vos paramètres avant jeudi 14h.', targetAudience: 'store_owners', channel: 'sms', status: 'sent', sentAt: '2026-08-19 10:00', deliveredCount: 420, openedCount: 395, createdBy: 'Mounir Zaidi' },
  { id: 'notif_4', title: 'Campagne de Recrutement Artisans & Prestataires Grand Sud', message: 'Offre spéciale commission réduite 5% pour les nouveaux prestataires dans les wilayas du Sud.', targetAudience: 'service_providers', channel: 'in_app', status: 'scheduled', scheduledFor: '2026-09-01 09:00', deliveredCount: 0, openedCount: 0, createdBy: 'Fatima Zohra Charef' },
];

const SEED_MESSAGES: AdminMessage[] = [
  { id: 'msg_1', conversationId: 'conv_1', senderName: 'Amina Belkacem (DzTech)', senderRole: 'store_owner', recipientName: 'Khidmatik Support Desk', recipientRole: 'support', subject: 'Request for Premium Store verification badge update', lastMessageSnippet: 'Here is our updated commercial register document for verification.', unreadCount: 1, status: 'active', lastActivity: '2026-08-23 08:45', priority: 'normal' },
  { id: 'msg_2', conversationId: 'conv_2', senderName: 'Sofiane Mansouri (Plumber)', senderRole: 'service_provider', recipientName: 'Khidmatik Finance Desk', recipientRole: 'finance', subject: 'Question regarding BaridiMob settlement timeline', lastMessageSnippet: 'Thank you for the quick transfer confirmation, received successfully.', unreadCount: 0, status: 'closed', lastActivity: '2026-08-22 16:30', priority: 'normal' },
  { id: 'msg_3', conversationId: 'conv_3', senderName: 'Amine Ferhani (Client)', senderRole: 'customer', recipientName: 'Dispute Arbitration Officer', recipientRole: 'moderator', subject: 'Evidence attached for Case DSP-2026-501', lastMessageSnippet: 'Attached high-res photos of the damaged box with Yalidine tracking label.', unreadCount: 2, status: 'active', lastActivity: '2026-08-23 09:10', priority: 'high' },
];

const SEED_CATEGORIES: AdminCategory[] = [
  { id: 'cat_1', name: 'Electronics & Computers', nameAr: 'الإلكترونيات والحواسيب', nameFr: 'Électronique & Informatique', slug: 'electronics-computers', iconName: 'Laptop', type: 'store', itemCount: 340, displayOrder: 1, isActive: true, isFeatured: true },
  { id: 'cat_2', name: 'Auto Spare Parts', nameAr: 'قطع غيار السيارات', nameFr: 'Pièces Détachées Auto', slug: 'auto-spare-parts', iconName: 'Wrench', type: 'spare_parts', itemCount: 680, displayOrder: 2, isActive: true, isFeatured: true },
  { id: 'cat_3', name: 'Plumbing & Heating', nameAr: 'السباكة والتدفئة', nameFr: 'Plomberie & Chauffage', slug: 'plumbing-heating', iconName: 'Pipette', type: 'craftsman', itemCount: 145, displayOrder: 3, isActive: true, isFeatured: true },
  { id: 'cat_4', name: 'Electrical & Solar', nameAr: 'الكهرباء والطاقة الشمسية', nameFr: 'Électricité & Solaire', slug: 'electrical-solar', iconName: 'Zap', type: 'craftsman', itemCount: 110, displayOrder: 4, isActive: true, isFeatured: true },
  { id: 'cat_5', name: 'Banquet Halls & Events', nameAr: 'قاعات الحفلات والمناسبات', nameFr: 'Salles des Fêtes & Événements', slug: 'banquet-halls', iconName: 'Building', type: 'banquet_hall', itemCount: 75, displayOrder: 5, isActive: true, isFeatured: true },
  { id: 'cat_6', name: 'Home & Furniture', nameAr: 'الأثاث والديكور المنزلي', nameFr: 'Maison & Décoration', slug: 'home-furniture', iconName: 'Armchair', type: 'store', itemCount: 220, displayOrder: 6, isActive: true, isFeatured: true },
  { id: 'cat_7', name: 'Beauty & Health', nameAr: 'الصحة والجمال', nameFr: 'Beauté & Santé', slug: 'beauty-health', iconName: 'Sparkles', type: 'store', itemCount: 180, displayOrder: 7, isActive: true, isFeatured: false },
  { id: 'cat_8', name: 'HVAC & Air Conditioning', nameAr: 'التكييف والتهوية', nameFr: 'Climatisation & Froid', slug: 'hvac-ac', iconName: 'Wind', type: 'professional', itemCount: 95, displayOrder: 8, isActive: true, isFeatured: true },
];

const SEED_LOCATIONS: AdminLocation[] = [
  { id: 'loc_16', wilayaCode: '16', nameEn: 'Algiers', nameAr: 'الجزائر', nameFr: 'Alger', communesCount: 57, shippingZone: 'Zone 1 (Algiers & Coast)', baseShippingCost: 400, expressShippingCost: 700, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis', 'Kazi Tour', 'In-House Express'] },
  { id: 'loc_31', wilayaCode: '31', nameEn: 'Oran', nameAr: 'وهران', nameFr: 'Oran', communesCount: 26, shippingZone: 'Zone 1 (Algiers & Coast)', baseShippingCost: 550, expressShippingCost: 900, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis'] },
  { id: 'loc_25', wilayaCode: '25', nameEn: 'Constantine', nameAr: 'قسنطينة', nameFr: 'Constantine', communesCount: 12, shippingZone: 'Zone 1 (Algiers & Coast)', baseShippingCost: 550, expressShippingCost: 900, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis'] },
  { id: 'loc_09', wilayaCode: '09', nameEn: 'Blida', nameAr: 'البليدة', nameFr: 'Blida', communesCount: 25, shippingZone: 'Zone 1 (Algiers & Coast)', baseShippingCost: 450, expressShippingCost: 750, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis', 'In-House Express'] },
  { id: 'loc_19', wilayaCode: '19', nameEn: 'Setif', nameAr: 'سطيف', nameFr: 'Sétif', communesCount: 60, shippingZone: 'Zone 2 (Central Plains)', baseShippingCost: 600, expressShippingCost: 950, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis'] },
  { id: 'loc_05', wilayaCode: '05', nameEn: 'Batna', nameAr: 'باتنة', nameFr: 'Batna', communesCount: 61, shippingZone: 'Zone 2 (Central Plains)', baseShippingCost: 650, expressShippingCost: 1000, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine'] },
  { id: 'loc_13', wilayaCode: '13', nameEn: 'Tlemcen', nameAr: 'تلمسان', nameFr: 'Tlemcen', communesCount: 53, shippingZone: 'Zone 2 (Central Plains)', baseShippingCost: 650, expressShippingCost: 1000, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis'] },
  { id: 'loc_23', wilayaCode: '23', nameEn: 'Annaba', nameAr: 'عنابة', nameFr: 'Annaba', communesCount: 12, shippingZone: 'Zone 1 (Algiers & Coast)', baseShippingCost: 600, expressShippingCost: 950, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine', 'Procolis'] },
  { id: 'loc_30', wilayaCode: '30', nameEn: 'Ouargla', nameAr: 'ورقلة', nameFr: 'Ouargla', communesCount: 21, shippingZone: 'Zone 4 (Sahara)', baseShippingCost: 950, expressShippingCost: 1600, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine'] },
  { id: 'loc_47', wilayaCode: '47', nameEn: 'Ghardaia', nameAr: 'غرداية', nameFr: 'Ghardaïa', communesCount: 13, shippingZone: 'Zone 4 (Sahara)', baseShippingCost: 900, expressShippingCost: 1500, isDeliveryAvailable: true, isServiceAvailable: true, activeCouriers: ['Yalidine'] },
];

const SEED_AUDIT_LOGS: AdminAuditLog[] = [
  { id: 'aud_1', timestamp: '2026-08-23 08:30:15', actor: 'karim.hadjadj@gmail.com', actorRole: 'SUPER_ADMIN', actionType: 'LOGIN', entityType: 'AuthSession', entityId: 'ses_99182', description: 'Successful 2FA Super Admin login from Hydra office', ipAddress: '105.101.44.12', userAgent: 'Chrome 128 on macOS Sonoma' },
  { id: 'aud_2', timestamp: '2026-08-23 08:15:22', actor: 'mounir.zaidi@khidmatik.dz', actorRole: 'FINANCE', actionType: 'APPROVE', entityType: 'Withdrawal', entityId: 'WTH-2026-4402', description: 'Approved BaridiMob payout 65,000 DA for Plomberie Express', ipAddress: '105.101.44.18', userAgent: 'Chrome 128 on Windows 11', oldValue: { status: 'pending' }, newValue: { status: 'approved' } },
  { id: 'aud_3', timestamp: '2026-08-22 17:40:10', actor: 'fatima.charef@gmail.com', actorRole: 'MODERATOR', actionType: 'SUSPEND', entityType: 'User', entityId: 'usr_7', description: 'Suspended suspicious account for repeated 3DS payment failure', ipAddress: '197.200.18.9', userAgent: 'Firefox 129 on Linux', oldValue: { status: 'active' }, newValue: { status: 'suspended' } },
  { id: 'aud_4', timestamp: '2026-08-22 14:05:00', actor: 'karim.hadjadj@gmail.com', actorRole: 'SUPER_ADMIN', actionType: 'CONFIG_CHANGE', entityType: 'PlatformCommission', entityId: 'comm_1', description: 'Updated Electronics category commission rate from 10% to 8%', ipAddress: '105.101.44.12', userAgent: 'Chrome 128 on macOS', oldValue: { defaultRatePercent: 10 }, newValue: { defaultRatePercent: 8 } },
  { id: 'aud_5', timestamp: '2026-08-22 11:20:45', actor: 'system_security_bot', actorRole: 'SYSTEM', actionType: 'DELETE', entityType: 'Review', entityId: 'rev_4', description: 'Automated quarantine of spam comment containing scam URL', ipAddress: '127.0.0.1', userAgent: 'Internal Security Daemon' },
];

// ------------------------------------------------------------------------------------------------
// REACTIVE STORE & REPOSITORY SERVICE
// ------------------------------------------------------------------------------------------------

class AdminDataService {
  private getStorage<T>(key: string, fallback: T[]): T[] {
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(`khidmatik_admin_${key}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(`Failed reading localStorage for ${key}`, e);
    }
    return fallback;
  }

  private setStorage<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`khidmatik_admin_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed writing localStorage for ${key}`, e);
    }
  }

  private async execDb(action: () => PromiseLike<any>): Promise<void> {
    try {
      await action();
    } catch (e) {
      // Non-blocking database background sync
    }
  }

  // ==============================================================================
  // ASYNCHRONOUS SUPABASE LIVE DATABASE INTEGRATION
  // ==============================================================================

  public async fetchUsersFromDb(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('member_since', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminUser[] = data.map((p: any) => ({
          id: p.id,
          userName: p.name || 'User',
          email: p.email || '',
          phone: p.phone || '',
          role: (p.role?.toLowerCase() as AdminUser['role']) || 'customer',
          status: p.is_verified ? 'active' : 'pending_verification',
          wilaya: 'Algiers (16)',
          city: 'Alger Centre',
          registrationDate: p.member_since ? p.member_since.split('T')[0] : '2026-08-01',
          lastLogin: p.updated_at ? p.updated_at.split('T')[0] : '2026-08-20',
          avatarUrl: p.avatar_url,
          ordersCount: 0,
          totalSpent: p.wallet_balance ? parseFloat(p.wallet_balance) : 0,
          verifiedEmail: true,
          verifiedPhone: Boolean(p.phone),
          twoFactorEnabled: false,
        }));
        this.saveUsers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching profiles from Supabase, using cache:', e);
    }
    return this.getUsers();
  }

  public async fetchStoresFromDb(): Promise<AdminStore[]> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          owner:profiles(name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminStore[] = data.map((s: any) => ({
          id: s.id,
          storeName: s.name,
          slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
          ownerName: s.owner?.name || 'Owner',
          ownerEmail: s.owner?.email || s.email || '',
          ownerPhone: s.owner?.phone || s.phone || '',
          category: s.category || 'General',
          wilaya: s.wilaya || 'Algiers',
          address: s.address || '',
          subscriptionPlan: (s.subscription_plan as AdminStore['subscriptionPlan']) || 'basic',
          subscriptionStatus: 'active',
          status: s.is_active ? 'active' : 'suspended',
          isFeatured: false,
          isVerified: s.is_verified ?? false,
          totalSalesCount: 0,
          totalRevenue: 0,
          productCount: 0,
          rating: 4.8,
          joinedDate: s.created_at ? s.created_at.split('T')[0] : '2026-08-01',
          commissionRate: 8,
        }));
        this.saveStores(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching stores from Supabase, using cache:', e);
    }
    return this.getStores();
  }

  public async fetchProductsFromDb(): Promise<AdminProduct[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores(name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminProduct[] = data.map((p: any) => ({
          id: p.id,
          sku: `SKU-${p.id.substring(0, 8).toUpperCase()}`,
          name: p.name,
          slug: p.name.toLowerCase().replace(/\s+/g, '-'),
          storeId: p.store_id,
          storeName: p.store?.name || 'Partner Store',
          category: p.category || 'General',
          price: parseFloat(p.price_da) || 0,
          stock: p.stock_quantity ?? 0,
          status: p.is_active ? (p.stock_quantity > 0 ? 'active' : 'out_of_stock') : 'draft',
          isMadeInAlgeria: true,
          salesCount: 0,
          rating: 4.8,
          reviewCount: 0,
          imageUrl: Array.isArray(p.images) && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
          createdDate: p.created_at ? p.created_at.split('T')[0] : '2026-08-10',
          description: p.description || p.name,
        }));
        this.saveProducts(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching products from Supabase, using cache:', e);
    }
    return this.getProducts();
  }

  public async fetchOrdersFromDb(): Promise<AdminOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:profiles(name, email, phone),
          store:stores(name),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminOrder[] = data.map((o: any) => {
          const rawStatus = (o.status || 'PENDING').toLowerCase();
          const mappedFulfillment: AdminOrder['fulfillmentStatus'] =
            rawStatus === 'shipped' ? 'shipped' :
            rawStatus === 'delivered' ? 'delivered' :
            rawStatus === 'cancelled' ? 'cancelled' : 'processing';

          const itemsArr = Array.isArray(o.order_items) ? o.order_items : [];
          const summary = itemsArr.length > 0 
            ? itemsArr.map((it: any) => `${it.product_name} (x${it.quantity})`).join(', ')
            : 'Order items';

          return {
            id: o.id,
            orderNumber: o.id.startsWith('KHM') ? o.id : `KHM-${o.id.substring(0, 8).toUpperCase()}`,
            customerId: o.customer_id || 'usr_1',
            customerName: o.customer?.name || 'Customer',
            customerEmail: o.customer?.email || 'customer@khidmatik.dz',
            customerPhone: o.customer?.phone || '',
            storeId: o.store_id,
            storeName: o.store?.name || 'Store',
            itemsCount: itemsArr.length || 1,
            itemsSummary: summary,
            totalAmount: parseFloat(o.total_amount_da) || 0,
            shippingFee: 800,
            discountAmount: 0,
            paymentStatus: rawStatus === 'cancelled' ? 'refunded' : 'paid',
            paymentMethod: 'edahabia',
            fulfillmentStatus: mappedFulfillment,
            wilaya: o.shipping_wilaya || 'Algiers (16)',
            deliveryAddress: o.shipping_address || 'Alger Centre',
            courier: 'yalidine',
            trackingNumber: o.tracking_number || `YAL-${o.id.substring(0, 6)}`,
            orderDate: o.created_at ? o.created_at.replace('T', ' ').substring(0, 19) : '2026-08-20 10:00',
          };
        });
        this.saveOrders(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching orders from Supabase, using cache:', e);
    }
    return this.getOrders();
  }

  public async fetchBookingsFromDb(): Promise<AdminBooking[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:profiles!appointments_customer_id_fkey(name, phone, email),
          provider:profiles!appointments_provider_id_fkey(name, phone)
        `)
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminBooking[] = data.map((b: any) => ({
          id: b.id,
          bookingCode: `RES-${b.id.substring(0, 6).toUpperCase()}`,
          customerName: b.patient_name || b.customer?.name || 'Client',
          customerPhone: b.customer?.phone || '',
          customerEmail: b.customer?.email || 'client@khidmatik.dz',
          providerOrVenueName: b.provider?.name || 'Professional Provider',
          type: 'service',
          category: 'Service',
          scheduledDate: b.date,
          timeSlot: b.time_slot || '10:00 - 11:00',
          totalPrice: 3500,
          depositPaid: 1000,
          status: b.status || 'confirmed',
          wilaya: 'Algiers (16)',
          address: b.notes || 'On-Site / Cabinet',
          createdAt: b.created_at ? b.created_at.split('T')[0] : '2026-08-15',
        }));
        this.saveBookings(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching bookings from Supabase, using cache:', e);
    }
    return this.getBookings();
  }

  public async fetchCategoriesFromDb(): Promise<AdminCategory[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: AdminCategory[] = data.map((c: any, index: number) => ({
          id: c.id,
          name: c.name,
          nameAr: c.name,
          nameFr: c.name,
          slug: c.slug,
          iconName: c.icon_name || 'ShoppingBag',
          type: (c.type as AdminCategory['type']) || 'store',
          itemCount: 50,
          displayOrder: index + 1,
          isActive: true,
          isFeatured: index < 6,
        }));
        this.saveCategories(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching categories from Supabase, using cache:', e);
    }
    return this.getCategories();
  }

  public async fetchReviewsFromDb(): Promise<AdminReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AdminReview[] = data.map((r: any) => ({
          id: r.id,
          targetType: 'store',
          targetId: r.store_id || 'store',
          targetName: 'Khidmatik Merchant',
          authorName: r.author_name || 'Customer',
          authorEmail: 'customer@khidmatik.dz',
          rating: r.rating || 5,
          comment: r.comment || '',
          sentiment: (r.rating || 5) >= 4 ? 'positive' : (r.rating === 3 ? 'neutral' : 'negative'),
          status: 'approved',
          createdAt: r.created_at ? r.created_at.replace('T', ' ').substring(0, 16) : '2026-08-20 12:00',
        }));
        this.saveReviews(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Error fetching reviews from Supabase, using cache:', e);
    }
    return this.getReviews();
  }

  public async fetchPlatformOverviewStats() {
    try {
      const [
        { count: userCount },
        { count: storeCount },
        { count: productCount },
        { count: orderCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('stores').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalUsers: userCount || this.getUsers().length,
        totalStores: storeCount || this.getStores().length,
        totalProducts: productCount || this.getProducts().length,
        totalOrders: orderCount || this.getOrders().length,
      };
    } catch (e) {
      return {
        totalUsers: this.getUsers().length,
        totalStores: this.getStores().length,
        totalProducts: this.getProducts().length,
        totalOrders: this.getOrders().length,
      };
    }
  }

  // Activity Log helper
  public recordAudit(actor: string, actionType: AdminAuditLog['actionType'], entityType: string, entityId: string, description: string, oldValue?: any, newValue?: any) {
    const logs = this.getAuditLogs();
    const newLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor,
      actorRole: 'ADMIN',
      actionType,
      entityType,
      entityId,
      description,
      ipAddress: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      oldValue,
      newValue
    };
    this.setStorage('audit_logs', [newLog, ...logs]);

    // Asynchronously log to Supabase admin_audit_logs table
    this.execDb(() =>
      supabase.from('admin_audit_logs').insert({
        action: actionType,
        entity_type: entityType,
        entity_id: entityId,
        metadata: { description, actor },
        previous_state: oldValue || {},
        new_state: newValue || {},
      })
    );
  }

  // 1. Users
  public getUsers(): AdminUser[] { return this.getStorage('users', SEED_USERS); }
  public saveUsers(items: AdminUser[]) { this.setStorage('users', items); }
  public updateUserStatus(id: string, status: AdminUser['status'], actor: string = 'Admin') {
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return;
    const oldStatus = target.status;
    target.status = status;
    this.saveUsers(users);
    this.recordAudit(actor, 'UPDATE', 'User', id, `Updated user ${target.userName} status to ${status}`, { status: oldStatus }, { status });

    // Sync to Supabase
    this.execDb(() => supabase.from('profiles').update({ is_verified: status === 'active' }).eq('id', id));
  }

  // 2. Providers
  public getProviders(): AdminProvider[] { return this.getStorage('providers', SEED_PROVIDERS); }
  public saveProviders(items: AdminProvider[]) { this.setStorage('providers', items); }
  public updateProviderStatus(id: string, status: AdminProvider['status'], actor: string = 'Admin') {
    const list = this.getProviders();
    const target = list.find(p => p.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveProviders(list);
    this.recordAudit(actor, 'UPDATE', 'Provider', id, `Changed provider ${target.providerName} status to ${status}`, { status: old }, { status });
  }

  // 3. Stores
  public getStores(): AdminStore[] { return this.getStorage('stores', SEED_STORES); }
  public saveStores(items: AdminStore[]) { this.setStorage('stores', items); }
  public updateStoreStatus(id: string, status: AdminStore['status'], actor: string = 'Admin') {
    const list = this.getStores();
    const target = list.find(s => s.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveStores(list);
    this.recordAudit(actor, 'UPDATE', 'Store', id, `Changed store ${target.storeName} status to ${status}`, { status: old }, { status });

    // Sync to Supabase
    this.execDb(() => supabase.from('stores').update({ is_active: status === 'active' }).eq('id', id));
  }

  // 4. Products
  public getProducts(): AdminProduct[] { return this.getStorage('products', SEED_PRODUCTS); }
  public saveProducts(items: AdminProduct[]) { this.setStorage('products', items); }
  public updateProductStatus(id: string, status: AdminProduct['status'], actor: string = 'Admin') {
    const list = this.getProducts();
    const target = list.find(p => p.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveProducts(list);
    this.recordAudit(actor, 'UPDATE', 'Product', id, `Updated product ${target.name} status to ${status}`, { status: old }, { status });

    // Sync to Supabase
    this.execDb(() => supabase.from('products').update({ is_active: status === 'active' }).eq('id', id));
  }

  // 5. Services
  public getServices(): AdminService[] { return this.getStorage('services', SEED_SERVICES); }
  public saveServices(items: AdminService[]) { this.setStorage('services', items); }
  public updateServiceStatus(id: string, status: AdminService['status'], actor: string = 'Admin') {
    const list = this.getServices();
    const target = list.find(s => s.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveServices(list);
    this.recordAudit(actor, 'UPDATE', 'Service', id, `Updated service ${target.title} status to ${status}`, { status: old }, { status });
  }

  // 6. Orders
  public getOrders(): AdminOrder[] { return this.getStorage('orders', SEED_ORDERS); }
  public saveOrders(items: AdminOrder[]) { this.setStorage('orders', items); }
  public updateOrderStatus(id: string, fulfillmentStatus: AdminOrder['fulfillmentStatus'], actor: string = 'Admin') {
    const list = this.getOrders();
    const target = list.find(o => o.id === id);
    if (!target) return;
    const old = target.fulfillmentStatus;
    target.fulfillmentStatus = fulfillmentStatus;
    this.saveOrders(list);
    this.recordAudit(actor, 'UPDATE', 'Order', id, `Updated order ${target.orderNumber} fulfillment to ${fulfillmentStatus}`, { status: old }, { status: fulfillmentStatus });

    // Sync to Supabase
    this.execDb(() => supabase.from('orders').update({ status: fulfillmentStatus.toUpperCase() }).eq('id', id));
  }

  // 7. Bookings
  public getBookings(): AdminBooking[] { return this.getStorage('bookings', SEED_BOOKINGS); }
  public saveBookings(items: AdminBooking[]) { this.setStorage('bookings', items); }
  public updateBookingStatus(id: string, status: AdminBooking['status'], actor: string = 'Admin') {
    const list = this.getBookings();
    const target = list.find(b => b.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveBookings(list);
    this.recordAudit(actor, 'UPDATE', 'Booking', id, `Updated booking ${target.bookingCode} status to ${status}`, { status: old }, { status });

    // Sync to Supabase
    this.execDb(() => supabase.from('appointments').update({ status }).eq('id', id));
  }

  // 8. Payments
  public getPayments(): AdminPayment[] { return this.getStorage('payments', SEED_PAYMENTS); }
  public savePayments(items: AdminPayment[]) { this.setStorage('payments', items); }

  // 9. Transactions
  public getTransactions(): AdminTransaction[] { return this.getStorage('transactions', SEED_TRANSACTIONS); }
  public saveTransactions(items: AdminTransaction[]) { this.setStorage('transactions', items); }

  // 10. Commissions
  public getCommissions(): AdminCommission[] { return this.getStorage('commissions', SEED_COMMISSIONS); }
  public saveCommissions(items: AdminCommission[]) { this.setStorage('commissions', items); }

  // 11. Withdrawals
  public getWithdrawals(): AdminWithdrawal[] { return this.getStorage('withdrawals', SEED_WITHDRAWALS); }
  public saveWithdrawals(items: AdminWithdrawal[]) { this.setStorage('withdrawals', items); }
  public updateWithdrawalStatus(id: string, status: AdminWithdrawal['status'], actor: string = 'Mounir Zaidi', reason?: string) {
    const list = this.getWithdrawals();
    const target = list.find(w => w.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    target.processedDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    target.processedByAdmin = actor;
    if (reason) target.rejectionReason = reason;
    this.saveWithdrawals(list);
    this.recordAudit(actor, 'APPROVE', 'Withdrawal', id, `Processed payout ${target.payoutCode} (${target.requestedAmount} DA) with status: ${status}`, { status: old }, { status });
  }

  // 12. Refunds
  public getRefunds(): AdminRefund[] { return this.getStorage('refunds', SEED_REFUNDS); }
  public saveRefunds(items: AdminRefund[]) { this.setStorage('refunds', items); }
  public updateRefundStatus(id: string, status: AdminRefund['status'], actor: string = 'Admin') {
    const list = this.getRefunds();
    const target = list.find(r => r.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    target.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.saveRefunds(list);
    this.recordAudit(actor, 'REFUND', 'Refund', id, `Updated refund ${target.refundCode} status to ${status}`, { status: old }, { status });
  }

  // 13. Disputes
  public getDisputes(): AdminDispute[] { return this.getStorage('disputes', SEED_DISPUTES); }
  public saveDisputes(items: AdminDispute[]) { this.setStorage('disputes', items); }
  public updateDisputeStatus(id: string, status: AdminDispute['status'], notes?: string, actor: string = 'Admin') {
    const list = this.getDisputes();
    const target = list.find(d => d.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    target.lastUpdate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (notes) target.mediatorNotes = notes;
    this.saveDisputes(list);
    this.recordAudit(actor, 'UPDATE', 'Dispute', id, `Updated dispute ${target.caseNumber} to ${status}`, { status: old }, { status, notes });
  }

  // 14. Reviews
  public getReviews(): AdminReview[] { return this.getStorage('reviews', SEED_REVIEWS); }
  public saveReviews(items: AdminReview[]) { this.setStorage('reviews', items); }
  public updateReviewStatus(id: string, status: AdminReview['status'], actor: string = 'Admin') {
    const list = this.getReviews();
    const target = list.find(r => r.id === id);
    if (!target) return;
    const old = target.status;
    target.status = status;
    this.saveReviews(list);
    this.recordAudit(actor, 'UPDATE', 'Review', id, `Moderated review #${id} on ${target.targetName} to ${status}`, { status: old }, { status });
  }

  // 15. Reports
  public getReports(): AdminReport[] { return this.getStorage('reports', SEED_REPORTS); }
  public saveReports(items: AdminReport[]) { this.setStorage('reports', items); }

  // 16. Notifications
  public getNotifications(): AdminNotification[] { return this.getStorage('notifications', SEED_NOTIFICATIONS); }
  public saveNotifications(items: AdminNotification[]) { this.setStorage('notifications', items); }

  // 17. Messages
  public getMessages(): AdminMessage[] { return this.getStorage('messages', SEED_MESSAGES); }
  public saveMessages(items: AdminMessage[]) { this.setStorage('messages', items); }

  // 18. Categories
  public getCategories(): AdminCategory[] { return this.getStorage('categories', SEED_CATEGORIES); }
  public saveCategories(items: AdminCategory[]) { this.setStorage('categories', items); }

  // 19. Locations
  public getLocations(): AdminLocation[] { return this.getStorage('locations', SEED_LOCATIONS); }
  public saveLocations(items: AdminLocation[]) { this.setStorage('locations', items); }

  // 22. Audit Logs
  public getAuditLogs(): AdminAuditLog[] { return this.getStorage('audit_logs', SEED_AUDIT_LOGS); }
}

export const adminDataService = new AdminDataService();
