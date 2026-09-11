/**
 * Customer Orders, AliExpress-Style Tracking & Escrow Domain Types
 * Khidmatik Marketplace
 */

export type CustomerOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancel_requested'
  | 'cancelled'
  | 'refund_requested'
  | 'refund_processing'
  | 'refunded'
  | 'disputed';

export type CustomerOrderPaymentStatus =
  | 'pending'
  | 'paid'
  | 'held_in_escrow'
  | 'partially_released'
  | 'released'
  | 'refund_pending'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export interface CustomerOrderItemSnapshot {
  id: string;
  productId: string;
  sellerId: string;
  storeId: string;
  storeName: string;
  productName: string;
  productImage: string;
  sku?: string;
  variantId?: string;
  variantName?: string; // e.g. "Color: Space Grey / RAM: 16GB"
  quantity: number;
  unitPrice: number; // in DZD (DA)
  discountAmount: number;
  totalPrice: number; // in DZD (DA)
}

export interface CustomerOrderAddressSnapshot {
  id?: string;
  recipientName: string;
  phone: string;
  country: string;
  wilaya: string;
  commune: string;
  addressLine: string;
  postalCode?: string;
}

export interface OrderStatusHistoryRecord {
  id: string;
  orderId: string;
  status: CustomerOrderStatus;
  previousStatus?: CustomerOrderStatus;
  description: string;
  changedBy: string;
  changedByRole: 'CUSTOMER' | 'SELLER' | 'COURIER' | 'ADMIN' | 'SYSTEM';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CarrierTrackingStep {
  id: string;
  title: string;
  location?: string;
  timestamp: string;
  status: 'completed' | 'current' | 'pending';
  notes?: string;
}

export interface BuyerProtectionInfo {
  protectionDaysTotal: number; // e.g., 7 days or 15 days
  protectionEndsAt: string;
  isEligibleForRefund: boolean;
  canConfirmReceipt: boolean;
  escrowStatus: 'held_in_escrow' | 'released_to_seller' | 'refunded_to_buyer';
}

export interface CustomerOrder {
  id: string;
  orderNumber: string; // e.g. "KHM-2026-000001"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  storeSlug?: string;
  sellerId: string;
  sellerName?: string;
  sellerPhone?: string;
  status: CustomerOrderStatus;
  paymentStatus: CustomerOrderPaymentStatus;
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'returned';
  items: CustomerOrderItemSnapshot[];
  shippingAddress: CustomerOrderAddressSnapshot;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  platformFee: number;
  sellerAmount: number;
  totalAmount: number;
  currency: 'DZD';
  paymentMethod: 'edahabia' | 'baridimob' | 'cib' | 'cash_on_delivery' | 'wallet';
  paymentTransactionId?: string;
  shippingProvider: 'yalidine' | 'procolis' | 'kazi_tour' | 'in_house';
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  protection: BuyerProtectionInfo;
  statusHistory: OrderStatusHistoryRecord[];
  trackingSteps?: CarrierTrackingStep[];
  customerNotes?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------------------------
// CONTROLLED STATE MACHINE TRANSITIONS
// ------------------------------------------------------------------------------------------------

export const CUSTOMER_ORDER_FSM: Record<CustomerOrderStatus, CustomerOrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'cancel_requested', 'cancelled', 'refund_requested'],
  processing: ['ready_to_ship', 'cancel_requested', 'cancelled', 'refund_requested'],
  ready_to_ship: ['shipped', 'cancelled', 'refund_requested'],
  shipped: ['in_transit', 'delivered', 'disputed', 'refund_requested'],
  in_transit: ['out_for_delivery', 'delivered', 'disputed', 'refund_requested'],
  out_for_delivery: ['delivered', 'disputed', 'refund_requested'],
  delivered: ['completed', 'refund_requested', 'disputed'],
  completed: ['refund_requested', 'disputed'],
  cancel_requested: ['cancelled', 'processing'],
  cancelled: [], // Terminal
  refund_requested: ['refund_processing', 'refunded', 'disputed', 'completed'],
  refund_processing: ['refunded', 'disputed'],
  refunded: [], // Terminal
  disputed: ['refunded', 'completed', 'delivered'],
};

/**
 * Validates whether a state transition is legal
 */
export function validateCustomerOrderTransition(
  currentStatus: CustomerOrderStatus,
  targetStatus: CustomerOrderStatus,
  actorRole: 'CUSTOMER' | 'SELLER' | 'COURIER' | 'ADMIN' | 'SYSTEM'
): { isValid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { isValid: false, error: `Order is already in ${targetStatus} status.` };
  }

  const allowedTransitions = CUSTOMER_ORDER_FSM[currentStatus] || [];
  if (!allowedTransitions.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Illegal state transition: Cannot advance order from ${currentStatus} to ${targetStatus}.`,
    };
  }

  // Security Rule: Sellers cannot mark order as "completed" directly.
  if (targetStatus === 'completed' && actorRole === 'SELLER') {
    return {
      isValid: false,
      error: 'Sellers cannot complete orders directly. Completion requires Customer receipt confirmation or automatic protection expiration.',
    };
  }

  // Security Rule: Customers cannot directly mark order as "shipped" or "in_transit".
  if ((targetStatus === 'shipped' || targetStatus === 'in_transit' || targetStatus === 'out_for_delivery') && actorRole === 'CUSTOMER') {
    return {
      isValid: false,
      error: 'Only shipping carriers or merchants can update dispatch milestones.',
    };
  }

  return { isValid: true };
}
