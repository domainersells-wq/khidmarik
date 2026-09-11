/**
 * Rejection Cost Allocation & Seller Subscription Protection Domain Types
 * Khidmatik Marketplace
 */

export type RejectionReasonCategory =
  | 'BUYER'
  | 'SELLER'
  | 'COURIER'
  | 'SHARED'
  | 'PLATFORM';

export type RejectionResponsibilityParty =
  | 'buyer'
  | 'seller'
  | 'courier'
  | 'buyer_seller_shared'
  | 'seller_platform_shared'
  | 'courier_platform_shared'
  | 'platform'
  | 'undetermined';

export interface RejectionFinancialRule {
  id: string;
  reasonCode: string;
  category: RejectionReasonCategory;
  label: string;
  description: string;
  defaultResponsibility: RejectionResponsibilityParty;
  buyerShippingSharePct: number;
  sellerShippingSharePct: number;
  platformShippingSharePct: number;
  courierShippingSharePct: number;
  shippingFeeRefundable: boolean;
  platformFeeRefundable: boolean;
  subscriptionProtectionAllowed: boolean;
  requiresEvidence: boolean;
  requiresManualReview: boolean;
  enabled: boolean;
}

export interface SellerSubscriptionProtectionConfig {
  planId: string; // 'free' | 'basic' | 'pro' | 'premium_annual'
  planName: string;
  sellerProtectionEnabled: boolean;
  shippingProtectionPercentage: number; // e.g. 50%
  returnShippingProtectionPercentage: number;
  maxShippingProtectionPerOrder: number; // in DZD (DA)
  monthlyShippingProtectionLimit: number; // in DZD (DA)
  maxProtectedRejectionsPerMonth: number;
  platformFeeDiscountPercentage: number;
  sellerFaultProtectionEnabled: boolean;
  sharedLiabilityEnabled: boolean;
  fraudProtectionEnabled: boolean;
}

export interface CostAllocationCalculationResult {
  orderId: string;
  orderNumber: string;
  reasonCode: string;
  category: RejectionReasonCategory;
  responsibilityParty: RejectionResponsibilityParty;
  
  // Cost Base Components
  productAmount: number;
  outboundShippingCost: number;
  returnShippingCost: number;
  totalShippingCost: number;
  platformShippingFee: number; // e.g. 10% take-rate on shipping
  
  // Liability Shares (Before Subscription Protection)
  buyerShippingShare: number;
  sellerShippingShare: number;
  platformShippingShare: number;
  courierShippingShare: number;
  
  // Seller Subscription Protection Application
  sellerSubscriptionPlanId: string;
  sellerProtectionEligible: boolean;
  sellerProtectionPercentageApplied: number;
  sellerProtectionAmount: number; // Platform contribution toward seller's share
  
  // Final Net Liabilities
  finalCustomerRefund: number;
  finalSellerCharge: number;
  finalPlatformCost: number;
  finalCourierCharge: number;
  
  explanation: string;
  requiresReview: boolean;
}

export interface OrderCostAllocationSnapshot extends CostAllocationCalculationResult {
  id: string;
  rejectionId: string;
  status: 'pending_review' | 'allocated' | 'disputed' | 'finalized';
  createdAt: string;
}

export interface SellerProtectionUsageStats {
  sellerId: string;
  planId: string;
  planName: string;
  shippingProtectionPercentage: number;
  monthlyProtectionLimit: number;
  monthlyProtectionUsed: number;
  remainingMonthlyProtection: number;
  maxProtectedRejectionsPerMonth: number;
  protectedRejectionsCount: number;
  activeProtectionClaims: Array<{
    id: string;
    orderNumber: string;
    reasonCode: string;
    amountCoveredByPlatform: number;
    date: string;
  }>;
}

export interface SubmitRejectionInput {
  orderId: string;
  customerId?: string;
  reasonCode: string;
  customerNotes?: string;
  evidenceUrls?: string[];
}
