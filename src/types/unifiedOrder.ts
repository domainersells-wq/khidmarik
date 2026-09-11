/**
 * Centralized Unified Order Management System Types & Finite State Machine (FSM)
 * Khidmatik Super-App Platform
 */

export type UnifiedOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type UnifiedPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'FAILED';

export type UnifiedDeliveryStatus =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED';

export type UnifiedOrderSource =
  | 'marketplace'
  | 'store'
  | 'professional_service'
  | 'craftsman'
  | 'banquet_hall';

export interface UnifiedOrderItem {
  id: string;
  itemId: string; // Product ID or Service ID
  name: string;
  skuOrCode?: string;
  variantId?: string;
  variantAttributes?: Record<string, string>; // e.g. { Color: "Black", Size: "XL" }
  itemType: 'product' | 'spare_part' | 'service' | 'banquet_hall' | 'digital';
  unitPrice: number; // in DZD (DA)
  quantity: number;
  lineTotal: number; // unitPrice * quantity
  imageUrl?: string;
  commissionRatePercent?: number; // e.g. 10%
  serviceScheduledDate?: string; // For bookings/services
  serviceDurationMinutes?: number;
  requiresInstallation?: boolean;
}

export interface UnifiedCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  wilaya: string;
  city?: string;
  deliveryAddress: string;
  postalCode?: string;
  notes?: string;
}

export interface UnifiedSellerOrProviderInfo {
  id: string;
  name: string;
  entityType: 'store' | 'provider' | 'venue' | 'marketplace_seller';
  email: string;
  phone: string;
  wilaya: string;
  address?: string;
  payoutMethod?: 'ccp' | 'baridimob' | 'bna' | 'cash';
  payoutAccountNumber?: string;
}

export interface UnifiedOrderFinancials {
  currency: 'DZD';
  itemsSubtotal: number;
  shippingFee: number;
  serviceFee: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number; // e.g. 19% TVA where applicable
  platformCommission: number; // total platform cut
  netSellerPayout: number; // itemsSubtotal - platformCommission + shipping (if seller handles shipping)
  totalAmount: number; // final amount paid by customer
  depositPaid?: number; // for bookings
  remainingBalance?: number;
}

export interface UnifiedOrderTimelineEvent {
  id: string;
  timestamp: string;
  previousStatus?: UnifiedOrderStatus;
  newStatus: UnifiedOrderStatus;
  operator: string;
  operatorRole: 'CUSTOMER' | 'SELLER' | 'PROVIDER' | 'COURIER' | 'ADMIN' | 'SYSTEM';
  actionTitle: string;
  notes?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export interface UnifiedOrderDeliveryInfo {
  courier: 'yalidine' | 'procolis' | 'kazi_tour' | 'in_house' | 'self_pickup' | 'none';
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  proofOfDeliveryOtp?: string;
  deliveryStatus: UnifiedDeliveryStatus;
}

export interface UnifiedOrderPaymentInfo {
  method: 'edahabia' | 'baridimob' | 'cib' | 'cash_on_delivery' | 'stripe' | 'wallet';
  status: UnifiedPaymentStatus;
  gatewayTransactionId?: string;
  paymentTimestamp?: string;
  paidAmount: number;
}

export interface UnifiedOrderDisputeInfo {
  isDisputed: boolean;
  disputeId?: string;
  openedAt?: string;
  openedBy?: string;
  reason?: string;
  claimAmount?: number;
  mediatorNotes?: string;
  resolution?: 'REFUND_BUYER' | 'PAY_SELLER' | 'PARTIAL_SPLIT' | 'DISMISSED';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface UnifiedOrder {
  id: string;
  orderNumber: string; // e.g. "KHD-2026-8801"
  source: UnifiedOrderSource;
  status: UnifiedOrderStatus;
  customer: UnifiedCustomerInfo;
  sellerOrProvider: UnifiedSellerOrProviderInfo;
  items: UnifiedOrderItem[];
  financials: UnifiedOrderFinancials;
  payment: UnifiedOrderPaymentInfo;
  delivery: UnifiedOrderDeliveryInfo;
  dispute?: UnifiedOrderDisputeInfo;
  timeline: UnifiedOrderTimelineEvent[];
  cancellationReason?: string;
  cancelledBy?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------------------------
// FINITE STATE MACHINE (FSM) RULES MATRIX
// ------------------------------------------------------------------------------------------------

/**
 * Permitted next status transitions mapped by current status
 */
export const ORDER_FSM_TRANSITIONS: Record<UnifiedOrderStatus, UnifiedOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'DISPUTED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED', 'DISPUTED'],
  PROCESSING: ['READY', 'CANCELLED', 'DISPUTED'],
  READY: ['DISPATCHED', 'DELIVERED', 'CANCELLED', 'DISPUTED'], // DELIVERED can be directly reached for on-site services or store pickup
  DISPATCHED: ['DELIVERED', 'DISPUTED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'DISPUTED', 'REFUNDED'],
  COMPLETED: ['REFUNDED', 'DISPUTED'],
  CANCELLED: [], // Terminal State
  REFUNDED: [], // Terminal State
  DISPUTED: ['CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'REFUNDED', 'CANCELLED'], // Resumed or Resolved by Mediator
};

export interface StateTransitionValidationResult {
  isValid: boolean;
  error?: string;
  requiredFields?: string[];
}

/**
 * Server-side State Machine Validator
 */
export function validateOrderStateTransition(
  currentStatus: UnifiedOrderStatus,
  targetStatus: UnifiedOrderStatus,
  actorRole: UnifiedOrderTimelineEvent['operatorRole'],
  context?: {
    cancellationReason?: string;
    refundAmount?: number;
    disputeReason?: string;
    trackingNumber?: string;
    otpCode?: string;
  }
): StateTransitionValidationResult {
  // 1. Check if same state
  if (currentStatus === targetStatus) {
    return { isValid: false, error: `Order is already in ${targetStatus} status.` };
  }

  // 2. Check FSM allowable transitions
  const allowedNext = ORDER_FSM_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Invalid state transition: Cannot transition order from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // 3. Permission checks by target state
  if (targetStatus === 'CANCELLED') {
    if (!context?.cancellationReason?.trim()) {
      return {
        isValid: false,
        error: 'A cancellation reason is required to cancel this order.',
        requiredFields: ['cancellationReason'],
      };
    }
  }

  if (targetStatus === 'REFUNDED') {
    if (actorRole !== 'ADMIN' && actorRole !== 'SELLER') {
      return {
        isValid: false,
        error: 'Only Administrators or Authorized Merchants can issue refunds.',
      };
    }
  }

  if (targetStatus === 'DISPATCHED') {
    if (actorRole === 'CUSTOMER') {
      return {
        isValid: false,
        error: 'Customers cannot mark orders as dispatched.',
      };
    }
  }

  if (currentStatus === 'DISPUTED') {
    if (actorRole !== 'ADMIN') {
      return {
        isValid: false,
        error: 'Only an Administrator / Platform Mediator can resolve or transition an active dispute.',
      };
    }
  }

  return { isValid: true };
}
