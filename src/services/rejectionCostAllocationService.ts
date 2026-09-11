'use client';

import {
  RejectionFinancialRule,
  SellerSubscriptionProtectionConfig,
  CostAllocationCalculationResult,
  OrderCostAllocationSnapshot,
  SellerProtectionUsageStats,
  SubmitRejectionInput,
} from '@/types/rejectionCostAllocation';
import { customerOrderService } from '@/services/customerOrderService';
import { CustomerOrder } from '@/types/customerOrder';

// ------------------------------------------------------------------------------------------------
// DEFAULT REJECTION FINANCIAL RULES TAXONOMY
// ------------------------------------------------------------------------------------------------

const DEFAULT_REJECTION_RULES: RejectionFinancialRule[] = [
  // BUYER RESPONSIBILITY
  {
    id: 'rule_buyer_01',
    reasonCode: 'changed_mind',
    category: 'BUYER',
    label: 'Changed Mind / No Longer Needed',
    description: 'Buyer decided not to purchase after package was dispatched. Buyer covers shipping & platform logistics fee.',
    defaultResponsibility: 'buyer',
    buyerShippingSharePct: 100,
    sellerShippingSharePct: 0,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: false,
    platformFeeRefundable: false,
    subscriptionProtectionAllowed: false,
    requiresEvidence: false,
    requiresManualReview: false,
    enabled: true,
  },
  {
    id: 'rule_buyer_02',
    reasonCode: 'ordered_by_mistake',
    category: 'BUYER',
    label: 'Ordered by Mistake / Duplicate Order',
    description: 'Buyer accidentally placed duplicate or wrong order without notifying before shipment.',
    defaultResponsibility: 'buyer',
    buyerShippingSharePct: 100,
    sellerShippingSharePct: 0,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: false,
    platformFeeRefundable: false,
    subscriptionProtectionAllowed: false,
    requiresEvidence: false,
    requiresManualReview: false,
    enabled: true,
  },
  {
    id: 'rule_buyer_03',
    reasonCode: 'wrong_variant_selected_by_customer',
    category: 'BUYER',
    label: 'Wrong Size / Variant Selected by Buyer',
    description: 'Buyer selected the wrong color/size variant during checkout.',
    defaultResponsibility: 'buyer',
    buyerShippingSharePct: 100,
    sellerShippingSharePct: 0,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: false,
    platformFeeRefundable: false,
    subscriptionProtectionAllowed: false,
    requiresEvidence: false,
    requiresManualReview: false,
    enabled: true,
  },

  // SELLER RESPONSIBILITY
  {
    id: 'rule_seller_01',
    reasonCode: 'wrong_product',
    category: 'SELLER',
    label: 'Wrong Item / Variant Sent by Seller',
    description: 'Merchant shipped a completely different product or model than ordered. Seller is liable; subscription protection applies.',
    defaultResponsibility: 'seller',
    buyerShippingSharePct: 0,
    sellerShippingSharePct: 100,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: true,
    platformFeeRefundable: true,
    subscriptionProtectionAllowed: true,
    requiresEvidence: true,
    requiresManualReview: false,
    enabled: true,
  },
  {
    id: 'rule_seller_02',
    reasonCode: 'damaged_before_shipping',
    category: 'SELLER',
    label: 'Defective / Damaged Before Shipment',
    description: 'Factory defect or item damaged prior to packaging.',
    defaultResponsibility: 'seller',
    buyerShippingSharePct: 0,
    sellerShippingSharePct: 100,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: true,
    platformFeeRefundable: true,
    subscriptionProtectionAllowed: true,
    requiresEvidence: true,
    requiresManualReview: false,
    enabled: true,
  },
  {
    id: 'rule_seller_03',
    reasonCode: 'product_not_as_described',
    category: 'SELLER',
    label: 'Product Not as Described on Listing',
    description: 'Specifications, brand, or features significantly differ from store listing.',
    defaultResponsibility: 'seller',
    buyerShippingSharePct: 0,
    sellerShippingSharePct: 100,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: true,
    platformFeeRefundable: true,
    subscriptionProtectionAllowed: true,
    requiresEvidence: true,
    requiresManualReview: false,
    enabled: true,
  },

  // COURIER RESPONSIBILITY
  {
    id: 'rule_courier_01',
    reasonCode: 'damaged_during_transport',
    category: 'COURIER',
    label: 'Package Crushed / Damaged by Carrier',
    description: 'Parcel suffered severe transit shock, water damage, or crushing during carrier transport.',
    defaultResponsibility: 'courier',
    buyerShippingSharePct: 0,
    sellerShippingSharePct: 0,
    platformShippingSharePct: 0,
    courierShippingSharePct: 100,
    shippingFeeRefundable: true,
    platformFeeRefundable: true,
    subscriptionProtectionAllowed: false,
    requiresEvidence: true,
    requiresManualReview: true,
    enabled: true,
  },

  // SHARED RESPONSIBILITY
  {
    id: 'rule_shared_01',
    reasonCode: 'unclear_listing',
    category: 'SHARED',
    label: 'Ambiguous Listing / Mutual Misunderstanding',
    description: 'Listing description was ambiguous. Shipping split 50/50 between Buyer and Seller.',
    defaultResponsibility: 'buyer_seller_shared',
    buyerShippingSharePct: 50,
    sellerShippingSharePct: 50,
    platformShippingSharePct: 0,
    courierShippingSharePct: 0,
    shippingFeeRefundable: false,
    platformFeeRefundable: false,
    subscriptionProtectionAllowed: true,
    requiresEvidence: false,
    requiresManualReview: false,
    enabled: true,
  },

  // PLATFORM / EXCEPTION
  {
    id: 'rule_platform_01',
    reasonCode: 'technical_error',
    category: 'PLATFORM',
    label: 'Platform Technical Glitch / System Error',
    description: 'Order processed incorrectly due to a system anomaly. Platform absorbs full logistics cost.',
    defaultResponsibility: 'platform',
    buyerShippingSharePct: 0,
    sellerShippingSharePct: 0,
    platformShippingSharePct: 100,
    courierShippingSharePct: 0,
    shippingFeeRefundable: true,
    platformFeeRefundable: true,
    subscriptionProtectionAllowed: false,
    requiresEvidence: false,
    requiresManualReview: true,
    enabled: true,
  },
];

// ------------------------------------------------------------------------------------------------
// DEFAULT SELLER SUBSCRIPTION PROTECTION CONFIGS
// ------------------------------------------------------------------------------------------------

const DEFAULT_SUBSCRIPTION_CONFIGS: Record<string, SellerSubscriptionProtectionConfig> = {
  free: {
    planId: 'free',
    planName: 'Free Starter',
    sellerProtectionEnabled: false,
    shippingProtectionPercentage: 0,
    returnShippingProtectionPercentage: 0,
    maxShippingProtectionPerOrder: 0,
    monthlyShippingProtectionLimit: 0,
    maxProtectedRejectionsPerMonth: 0,
    platformFeeDiscountPercentage: 0,
    sellerFaultProtectionEnabled: false,
    sharedLiabilityEnabled: false,
    fraudProtectionEnabled: false,
  },
  basic: {
    planId: 'basic',
    planName: 'Basic Merchant',
    sellerProtectionEnabled: true,
    shippingProtectionPercentage: 20, // 20% covered by platform
    returnShippingProtectionPercentage: 20,
    maxShippingProtectionPerOrder: 300, // max 300 DA per order
    monthlyShippingProtectionLimit: 2000, // max 2,000 DA / month
    maxProtectedRejectionsPerMonth: 5,
    platformFeeDiscountPercentage: 5,
    sellerFaultProtectionEnabled: true,
    sharedLiabilityEnabled: true,
    fraudProtectionEnabled: true,
  },
  pro: {
    planId: 'pro',
    planName: 'Professional Store',
    sellerProtectionEnabled: true,
    shippingProtectionPercentage: 50, // 50% covered by platform
    returnShippingProtectionPercentage: 50,
    maxShippingProtectionPerOrder: 600, // max 600 DA per order
    monthlyShippingProtectionLimit: 6000, // max 6,000 DA / month
    maxProtectedRejectionsPerMonth: 15,
    platformFeeDiscountPercentage: 15,
    sellerFaultProtectionEnabled: true,
    sharedLiabilityEnabled: true,
    fraudProtectionEnabled: true,
  },
  premium_annual: {
    planId: 'premium_annual',
    planName: 'Premium Enterprise VIP',
    sellerProtectionEnabled: true,
    shippingProtectionPercentage: 80, // 80% covered by platform
    returnShippingProtectionPercentage: 80,
    maxShippingProtectionPerOrder: 1200, // max 1,200 DA per order
    monthlyShippingProtectionLimit: 15000, // max 15,000 DA / month
    maxProtectedRejectionsPerMonth: 30,
    platformFeeDiscountPercentage: 25,
    sellerFaultProtectionEnabled: true,
    sharedLiabilityEnabled: true,
    fraudProtectionEnabled: true,
  },
};

// ------------------------------------------------------------------------------------------------
// REJECTION COST ALLOCATION SERVICE
// ------------------------------------------------------------------------------------------------

class RejectionCostAllocationService {
  private RULES_KEY = 'khidmatik_rejection_rules_v2';
  private SUBSCRIPTION_CONFIGS_KEY = 'khidmatik_subscription_protection_configs_v2';
  private ALLOCATIONS_KEY = 'khidmatik_order_cost_allocations_v2';
  private CLAIMS_KEY = 'khidmatik_seller_protection_claims_v2';

  public getFinancialRules(): RejectionFinancialRule[] {
    if (typeof window === 'undefined') return DEFAULT_REJECTION_RULES;
    try {
      const saved = localStorage.getItem(this.RULES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_REJECTION_RULES;
  }

  public getSubscriptionConfig(planId: string = 'basic'): SellerSubscriptionProtectionConfig {
    if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTION_CONFIGS[planId] || DEFAULT_SUBSCRIPTION_CONFIGS.free;
    try {
      const saved = localStorage.getItem(this.SUBSCRIPTION_CONFIGS_KEY);
      if (saved) {
        const configs = JSON.parse(saved);
        if (configs[planId]) return configs[planId];
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_SUBSCRIPTION_CONFIGS[planId] || DEFAULT_SUBSCRIPTION_CONFIGS.free;
  }

  /**
   * Pure Server-Side Cost Allocation Engine
   */
  public calculateCostAllocation(
    order: CustomerOrder,
    reasonCode: string,
    sellerPlanId: string = 'pro',
    returnShippingRatio: number = 0.5 // Default return shipping is 50% of outbound
  ): CostAllocationCalculationResult {
    const rules = this.getFinancialRules();
    const rule = rules.find((r) => r.reasonCode === reasonCode) || rules[0];
    const subConfig = this.getSubscriptionConfig(sellerPlanId);

    const productAmount = order.subtotal - order.discountAmount;
    const outboundShippingCost = order.shippingFee;
    const returnShippingCost = Math.round(outboundShippingCost * returnShippingRatio);
    const totalShippingCost = outboundShippingCost + returnShippingCost;
    
    // 10% platform logistics fee
    const platformShippingFee = Math.round(outboundShippingCost * 0.10);

    // 1. Initial percentage shares
    const buyerShippingShare = Math.round(totalShippingCost * (rule.buyerShippingSharePct / 100));
    let rawSellerShippingShare = Math.round(totalShippingCost * (rule.sellerShippingSharePct / 100));
    let rawPlatformShippingShare = Math.round(totalShippingCost * (rule.platformShippingSharePct / 100));
    const courierShippingShare = Math.round(totalShippingCost * (rule.courierShippingSharePct / 100));

    // 2. Apply Seller Subscription Protection
    let sellerProtectionAmount = 0;
    let sellerProtectionPercentageApplied = 0;
    const isProtectionEligible =
      rule.subscriptionProtectionAllowed &&
      subConfig.sellerProtectionEnabled &&
      rawSellerShippingShare > 0;

    if (isProtectionEligible) {
      sellerProtectionPercentageApplied = subConfig.shippingProtectionPercentage;
      const rawProtection = Math.round(rawSellerShippingShare * (sellerProtectionPercentageApplied / 100));
      
      // Apply Anti-Abuse Cap formula: min(rawProtection, maxProtectionPerOrder)
      sellerProtectionAmount = Math.min(rawProtection, subConfig.maxShippingProtectionPerOrder);
      
      // Platform absorbs the protection amount
      rawPlatformShippingShare += sellerProtectionAmount;
      rawSellerShippingShare -= sellerProtectionAmount;
    }

    // 3. Calculate Final Customer Refund
    // If buyer is responsible, deductions are applied for shipping & non-refundable fees
    let finalCustomerRefund = productAmount;
    if (rule.category === 'BUYER') {
      // Buyer pays outbound & return shipping + platform shipping fee
      finalCustomerRefund = Math.max(0, productAmount - buyerShippingShare - platformShippingFee);
    } else if (rule.category === 'SHARED') {
      // Shared responsibility: customer only pays their allocated share
      finalCustomerRefund = Math.max(0, productAmount + outboundShippingCost - buyerShippingShare);
    } else {
      // Seller / Courier / Platform fault: Customer receives 100% full refund (Product + Shipping Paid)
      finalCustomerRefund = order.totalAmount;
    }

    // 4. Determine Explanation
    let explanation = '';
    if (rule.category === 'BUYER') {
      explanation = `Buyer fault (${rule.label}): Buyer covers shipping (${buyerShippingShare.toLocaleString()} DA) and logistics fee (${platformShippingFee.toLocaleString()} DA). Seller charged 0 DA.`;
    } else if (rule.category === 'SELLER') {
      if (sellerProtectionAmount > 0) {
        explanation = `Seller fault (${rule.label}): Seller subscription (${subConfig.planName}) protected ${sellerProtectionPercentageApplied}% (${sellerProtectionAmount.toLocaleString()} DA). Seller pays net ${rawSellerShippingShare.toLocaleString()} DA. Platform pays ${sellerProtectionAmount.toLocaleString()} DA.`;
      } else {
        explanation = `Seller fault (${rule.label}): Seller pays full logistics costs (${rawSellerShippingShare.toLocaleString()} DA).`;
      }
    } else if (rule.category === 'COURIER') {
      explanation = `Carrier fault (${rule.label}): Courier charged ${courierShippingShare.toLocaleString()} DA. Buyer and seller fully indemnified.`;
    } else if (rule.category === 'SHARED') {
      explanation = `Shared liability (${rule.label}): Split 50/50. Seller subscription applied to seller share.`;
    } else {
      explanation = `Platform exception (${rule.label}): Platform absorbs full logistics cost (${rawPlatformShippingShare.toLocaleString()} DA).`;
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reasonCode: rule.reasonCode,
      category: rule.category,
      responsibilityParty: rule.defaultResponsibility,
      productAmount,
      outboundShippingCost,
      returnShippingCost,
      totalShippingCost,
      platformShippingFee,
      buyerShippingShare,
      sellerShippingShare: rawSellerShippingShare,
      platformShippingShare: rawPlatformShippingShare,
      courierShippingShare,
      sellerSubscriptionPlanId: subConfig.planId,
      sellerProtectionEligible: isProtectionEligible,
      sellerProtectionPercentageApplied,
      sellerProtectionAmount,
      finalCustomerRefund,
      finalSellerCharge: rawSellerShippingShare,
      finalPlatformCost: rawPlatformShippingShare,
      finalCourierCharge: courierShippingShare,
      explanation,
      requiresReview: rule.requiresManualReview || rule.requiresEvidence,
    };
  }

  /**
   * Submit an Order Rejection at Delivery Handover
   */
  public async submitOrderRejection(
    input: SubmitRejectionInput
  ): Promise<{ success: boolean; allocation?: OrderCostAllocationSnapshot; error?: string }> {
    const order = await customerOrderService.getOrderDetails(input.orderId);
    if (!order) return { success: false, error: 'Order not found' };

    // Calculate allocation using active seller subscription (e.g. 'pro')
    const sellerPlan = (order as any).sellerSubscriptionPlan || 'pro';
    const calculation = this.calculateCostAllocation(order, input.reasonCode, sellerPlan);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const snapshot: OrderCostAllocationSnapshot = {
      ...calculation,
      id: `alloc_${Date.now()}`,
      rejectionId: `rej_${Date.now()}`,
      status: calculation.requiresReview ? 'pending_review' : 'allocated',
      createdAt: nowStr,
    };

    // 1. Advance Order Status to delivery_rejected
    order.status = 'delivery_rejected' as any;
    order.updatedAt = nowStr;

    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'delivery_rejected' as any,
      description: `Delivery rejected by customer (${calculation.category}): ${input.reasonCode}. ${calculation.explanation}`,
      changedBy: input.customerId || 'Customer',
      changedByRole: 'CUSTOMER',
      metadata: {
        allocationId: snapshot.id,
        refundAmount: calculation.finalCustomerRefund,
        sellerCharge: calculation.finalSellerCharge,
        protectionUsed: calculation.sellerProtectionAmount,
      },
      createdAt: nowStr,
    });

    // 2. Persist Allocation Snapshot in localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.ALLOCATIONS_KEY);
        const allocations = saved ? JSON.parse(saved) : [];
        allocations.unshift(snapshot);
        localStorage.setItem(this.ALLOCATIONS_KEY, JSON.stringify(allocations));

        // If protection amount > 0, log to claims
        if (calculation.sellerProtectionAmount > 0) {
          const claimsSaved = localStorage.getItem(this.CLAIMS_KEY);
          const claims = claimsSaved ? JSON.parse(claimsSaved) : [];
          claims.unshift({
            id: `claim_${Date.now()}`,
            sellerId: order.sellerId,
            orderNumber: order.orderNumber,
            reasonCode: input.reasonCode,
            amountCoveredByPlatform: calculation.sellerProtectionAmount,
            date: nowStr,
          });
          localStorage.setItem(this.CLAIMS_KEY, JSON.stringify(claims));
        }

        // Save order back to customerOrderService
        const allOrdersStr = localStorage.getItem('khidmatik_customer_orders_v2');
        if (allOrdersStr) {
          const allOrders = JSON.parse(allOrdersStr);
          const idx = allOrders.findIndex((o: any) => o.id === order.id);
          if (idx !== -1) {
            allOrders[idx] = order;
            localStorage.setItem('khidmatik_customer_orders_v2', JSON.stringify(allOrders));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    return { success: true, allocation: snapshot };
  }

  /**
   * Get Seller Protection Monthly Usage Stats & Quota Balance
   */
  public getSellerProtectionUsage(
    sellerId: string = 'str_1',
    planId: string = 'pro'
  ): SellerProtectionUsageStats {
    const config = this.getSubscriptionConfig(planId);
    let claims: Array<{ id: string; orderNumber: string; reasonCode: string; amountCoveredByPlatform: number; date: string }> = [];

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.CLAIMS_KEY);
        if (saved) claims = JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }

    if (claims.length === 0) {
      claims = [
        { id: 'clm_1', orderNumber: 'KHM-2026-000004', reasonCode: 'wrong_variant_sent', amountCoveredByPlatform: 350, date: '2026-08-15' },
        { id: 'clm_2', orderNumber: 'KHM-2026-000009', reasonCode: 'unclear_listing', amountCoveredByPlatform: 200, date: '2026-08-20' },
      ];
    }

    const monthlyProtectionUsed = claims.reduce((acc, c) => acc + c.amountCoveredByPlatform, 0);
    const remainingMonthlyProtection = Math.max(0, config.monthlyShippingProtectionLimit - monthlyProtectionUsed);

    return {
      sellerId,
      planId: config.planId,
      planName: config.planName,
      shippingProtectionPercentage: config.shippingProtectionPercentage,
      monthlyProtectionLimit: config.monthlyShippingProtectionLimit,
      monthlyProtectionUsed,
      remainingMonthlyProtection,
      maxProtectedRejectionsPerMonth: config.maxProtectedRejectionsPerMonth,
      protectedRejectionsCount: claims.length,
      activeProtectionClaims: claims,
    };
  }
}

export const rejectionCostAllocationService = new RejectionCostAllocationService();
