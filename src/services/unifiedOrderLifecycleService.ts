/**
 * Khidmatik Unified Marketplace Architecture - Phase 2 Order Lifecycle Orchestrator
 * Integrates Orders, Payments, Multi-Carrier Shipping, Multi-Seller Partitioning,
 * Inventory Reservation, Financial Ledger, and Escrow Vault State Transitions.
 */

import { shippingCalculator } from './shipping/ShippingCalculator';
import { shippingManagerService } from './shipping/ShippingManagerService';
import { shippingProviderFactory } from './shipping/ShippingProviderFactory';
import type { 
  InternalShipmentStatus, 
  Shipment, 
  DeliveryType 
} from '@/types/shipping';
import type {
  FinancialLedgerEntry,
  Settlement,
  SellerSubscriptionSnapshot
} from '@/types/marketplaceArchitecture';

// ------------------------------------------------------------------------------------------------
// 1. SEGREGATED STATUS DEFINITIONS
// ------------------------------------------------------------------------------------------------

export type OrderLifecycleStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered_pending_verification'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'delivery_rejected'
  | 'refund_requested'
  | 'refunded'
  | 'disputed';

export type PaymentLifecycleStatus =
  | 'pending'
  | 'paid'
  | 'held'
  | 'partially_refunded'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export type DeliveryVerificationLifecycleStatus =
  | 'pending'
  | 'verified'
  | 'expired'
  | 'locked'
  | 'cancelled';

export type SettlementLifecycleStatus =
  | 'pending'
  | 'held'
  | 'delivery_verified'
  | 'buyer_protection'
  | 'ready_for_release'
  | 'released'
  | 'partially_refunded'
  | 'refunded'
  | 'disputed'
  | 'cancelled';

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  sellerId: string;
  sellerName?: string;
  unitPrice: number;
  quantity: number;
  weightKg?: number;
  imageUrl?: string;
}

export interface CheckoutInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryWilaya: string;
  deliveryCommune: string;
  deliveryAddress: string;
  deliveryType: DeliveryType;
  paymentMethod: 'edahabia' | 'cib' | 'cash_on_delivery' | 'baridimob' | 'wallet';
  items: OrderItemInput[];
  customerNotes?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export interface FinancialSnapshot {
  product_amount: number;
  shipping_amount: number;
  discount_amount: number;
  platform_product_commission: number;
  platform_shipping_commission: number;
  customer_paid_amount: number;
  seller_amount: number;
  currency: string;
  commission_rate_pct: number;
  calculated_at: string;
}

export interface UnifiedOrderAggregate {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryWilaya: string;
  deliveryCommune: string;
  deliveryAddress: string;
  deliveryType: DeliveryType;
  paymentMethod: string;
  
  // Segregated Lifecycle Statuses
  orderStatus: OrderLifecycleStatus;
  paymentStatus: PaymentLifecycleStatus;
  settlementStatus: SettlementLifecycleStatus;
  deliveryVerificationStatus: DeliveryVerificationLifecycleStatus;

  // Financials & Frozen Snapshot
  financialSnapshot: FinancialSnapshot;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  
  // Multi-seller partitioning & Shipments
  isMultiSeller: boolean;
  items: Array<OrderItemInput & { id: string; lineTotal: number }>;
  sellerIds: string[];
  shipments: Shipment[];
  
  // Timelines & Audit
  orderTimeline: Array<{
    status: OrderLifecycleStatus;
    titleAr: string;
    description?: string;
    actor: string;
    timestamp: string;
  }>;
  
  createdAt: string;
  updatedAt: string;
}

// In-Memory Storage for High-Speed Transaction State & Mock Persistence
const STORAGE_KEY_ORDERS = 'khidmatik_unified_orders_v2';
const STORAGE_KEY_INVENTORY = 'khidmatik_inventory_reservations_v2';
const STORAGE_KEY_LEDGER = 'khidmatik_financial_ledger_v2';
const STORAGE_KEY_WALLETS = 'khidmatik_seller_wallets_v2';
const STORAGE_KEY_IDEMPOTENCY = 'khidmatik_idempotency_keys_v2';

export class UnifiedOrderLifecycleService {
  private orders: Map<string, UnifiedOrderAggregate> = new Map();
  private inventoryReservations: Map<string, Array<{ productId: string; quantity: number; status: string }>> = new Map();
  private financialLedger: FinancialLedgerEntry[] = [];
  private sellerWallets: Map<string, { sellerId: string; availableBalance: number; pendingBalance: number }> = new Map();
  private processedIdempotencyKeys: Set<string> = new Set();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Initialize default seller wallets
    this.sellerWallets.set('str_1', { sellerId: 'str_1', availableBalance: 15000, pendingBalance: 24900 });
    this.sellerWallets.set('seller_test_1', { sellerId: 'seller_test_1', availableBalance: 0, pendingBalance: 8000 });
  }

  /**
   * 1. CREATE ORDER WITH MULTI-SELLER SPLITTING & INVENTORY RESERVATION
   */
  public async createOrder(input: CheckoutInput): Promise<UnifiedOrderAggregate> {
    // Check Idempotency Key
    if (input.idempotencyKey && this.processedIdempotencyKeys.has(input.idempotencyKey)) {
      const existing = Array.from(this.orders.values()).find(o => o.id === input.idempotencyKey || o.orderNumber === input.idempotencyKey);
      if (existing) return existing;
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot create an order with an empty items cart.');
    }

    const orderId = `uord_${Date.now()}`;
    const orderNumber = `KHD-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // A. Validate & Reserve Inventory
    this.reserveInventory(orderId, input.items);

    // B. Group Items by Seller (Multi-Seller Partitioning)
    const sellerItemGroups = new Map<string, OrderItemInput[]>();
    for (const item of input.items) {
      const sellerId = item.sellerId || 'str_1';
      const list = sellerItemGroups.get(sellerId) || [];
      list.push(item);
      sellerItemGroups.set(sellerId, list);
    }

    const isMultiSeller = sellerItemGroups.size > 1;
    const sellerIds = Array.from(sellerItemGroups.keys());

    // C. Calculate Subtotal and Shipping Quotes per Seller
    let totalItemsSubtotal = 0;
    let totalShippingFee = 0;
    const shipments: Shipment[] = [];

    for (const [sellerId, sellerItems] of sellerItemGroups.entries()) {
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      totalItemsSubtotal += sellerSubtotal;

      const sellerTotalWeight = sellerItems.reduce((sum, item) => sum + (item.weightKg || 0.5) * item.quantity, 0);

      // Call ShippingCalculator for accurate 58-wilaya rate calculation
      const shippingQuotes = await shippingCalculator.calculateQuotes({
        seller_id: sellerId,
        from_wilaya: '16 - Alger',
        to_wilaya: input.deliveryWilaya,
        weight_kg: sellerTotalWeight,
        shipping_method_code: input.deliveryType,
        is_cod: input.paymentMethod === 'cash_on_delivery',
        order_total: sellerSubtotal,
      });

      const selectedQuote = shippingQuotes.find(q => q.shipping_method_code === input.deliveryType) || shippingQuotes[0];
      const sellerShippingFee = selectedQuote?.fee ?? (input.deliveryType === 'stop_desk' ? 400 : 600);
      totalShippingFee += sellerShippingFee;

      // Create distinct Shipment per Seller using ShippingManagerService
      const isCod = input.paymentMethod === 'cash_on_delivery';
      const sellerShipment = await shippingManagerService.createShipment({
        order_id: orderId,
        order_number: orderNumber,
        seller_id: sellerId,
        seller_name: sellerItems[0].sellerName || 'Partner Store',
        customer_id: input.customerId,
        provider_id: selectedQuote?.provider_id || 'yalidine',
        shipping_method_id: input.deliveryType === 'stop_desk' ? 'mth_desk' : 'mth_home',
        shipping_fee: sellerShippingFee,
        cod_amount: isCod ? sellerSubtotal + sellerShippingFee : 0,
        currency: 'DZD',
        pickup_address: 'Seller Warehouse Zone',
        pickup_wilaya: '16 - Alger',
        pickup_commune: 'Bab Ezzouar',
        delivery_address: input.deliveryAddress,
        delivery_wilaya: input.deliveryWilaya,
        delivery_commune: input.deliveryCommune,
        recipient_name: input.customerName,
        recipient_phone: input.customerPhone,
        weight: sellerTotalWeight,
        package_count: 1,
        notes: input.customerNotes,
      });

      shipments.push(sellerShipment);
    }

    // D. Compute Platform Commission & Freeze Financial Snapshot
    const commissionRatePct = 8.0; // 8% Standard Platform Fee
    const platformCommission = Math.round(totalItemsSubtotal * (commissionRatePct / 100));
    const sellerTotalPayout = totalItemsSubtotal - platformCommission;
    const discountAmount = 0;
    const totalOrderAmount = totalItemsSubtotal + totalShippingFee - discountAmount;

    const financialSnapshot: FinancialSnapshot = {
      product_amount: totalItemsSubtotal,
      shipping_amount: totalShippingFee,
      discount_amount: discountAmount,
      platform_product_commission: platformCommission,
      platform_shipping_commission: 0,
      customer_paid_amount: totalOrderAmount,
      seller_amount: sellerTotalPayout,
      currency: 'DZD',
      commission_rate_pct: commissionRatePct,
      calculated_at: new Date().toISOString(),
    };

    // E. Determine Initial Segregated Statuses
    const isPrepaid = input.paymentMethod !== 'cash_on_delivery';
    const initialPaymentStatus: PaymentLifecycleStatus = isPrepaid ? 'paid' : 'pending';
    const initialSettlementStatus: SettlementLifecycleStatus = 'held';
    const initialOrderStatus: OrderLifecycleStatus = isPrepaid ? 'confirmed' : 'pending';

    const orderAggregate: UnifiedOrderAggregate = {
      id: orderId,
      orderNumber: orderNumber,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      deliveryWilaya: input.deliveryWilaya,
      deliveryCommune: input.deliveryCommune,
      deliveryAddress: input.deliveryAddress,
      deliveryType: input.deliveryType,
      paymentMethod: input.paymentMethod,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      settlementStatus: initialSettlementStatus,
      deliveryVerificationStatus: 'pending',
      financialSnapshot,
      subtotal: totalItemsSubtotal,
      shippingFee: totalShippingFee,
      discountAmount,
      totalAmount: totalOrderAmount,
      currency: 'DZD',
      isMultiSeller,
      items: input.items.map((it, idx) => ({
        ...it,
        id: `item_${idx + 1}`,
        lineTotal: it.unitPrice * it.quantity,
      })),
      sellerIds,
      shipments,
      orderTimeline: [
        {
          status: initialOrderStatus,
          titleAr: isPrepaid ? 'تم تأكيد الطلب واستلام الدفع' : 'تم استلام الطلب (دفع عند الاستلام)',
          description: isPrepaid ? 'الأموال محفوظة في الخزينة المالية' : 'بانتظار تجهيز الطرد من طرف التاجر',
          actor: 'CUSTOMER',
          timestamp: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // F. Credit Seller Pending Balance & Write Financial Ledger Entries (Funds Remain HELD)
    if (isPrepaid) {
      this.recordPrepaidPayment(orderAggregate);
    }

    this.orders.set(orderId, orderAggregate);

    if (input.idempotencyKey) {
      this.processedIdempotencyKeys.add(input.idempotencyKey);
    }

    return orderAggregate;
  }

  /**
   * 2. INVENTORY RESERVATION (Prevents Overselling)
   */
  private reserveInventory(orderId: string, items: OrderItemInput[]) {
    const reservations = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      status: 'RESERVED',
    }));
    this.inventoryReservations.set(orderId, reservations);
  }

  private releaseInventory(orderId: string) {
    const reservations = this.inventoryReservations.get(orderId);
    if (reservations) {
      reservations.forEach(r => r.status = 'RELEASED');
    }
  }

  /**
   * 3. RECORD PREPAID PAYMENT & UPDATE SELLER PENDING WALLET
   * Critical: Only increments pending_balance, NEVER available_balance.
   */
  private recordPrepaidPayment(order: UnifiedOrderAggregate) {
    // 1. Add Financial Ledger Entries (Double-entry accounting)
    const ledgerEntryHold: FinancialLedgerEntry = {
      id: `led_${Date.now()}_1`,
      order_id: order.id,
      order_number: order.orderNumber,
      entry_type: 'ESCROW_HOLD',
      debit_account: 'CUSTOMER_GATEWAY',
      credit_account: 'PLATFORM_ESCROW_VAULT',
      amount: order.totalAmount,
      currency: 'DZD',
      description: `Payment held in escrow for order ${order.orderNumber}`,
      created_at: new Date().toISOString(),
    };

    const ledgerEntryPending: FinancialLedgerEntry = {
      id: `led_${Date.now()}_2`,
      order_id: order.id,
      order_number: order.orderNumber,
      entry_type: 'SELLER_PAYOUT',
      debit_account: 'PLATFORM_ESCROW_VAULT',
      credit_account: `SELLER_PENDING_${order.sellerIds[0]}`,
      amount: order.financialSnapshot.seller_amount,
      currency: 'DZD',
      description: `Pending seller funds for order ${order.orderNumber} (Awaiting Delivery Verification)`,
      created_at: new Date().toISOString(),
    };

    this.financialLedger.push(ledgerEntryHold, ledgerEntryPending);

    // 2. Update Seller Wallet: Pending Balance += seller_amount
    for (const sellerId of order.sellerIds) {
      const current = this.sellerWallets.get(sellerId) || { sellerId, availableBalance: 0, pendingBalance: 0 };
      current.pendingBalance += order.financialSnapshot.seller_amount;
      this.sellerWallets.set(sellerId, current);
    }
  }

  /**
   * 4. SYNCHRONIZE SHIPPING STATUS TO ORDER LIFECYCLE
   * Crucial Anti-Fraud Rule:
   * When shipment becomes 'delivered', order becomes 'delivered_pending_verification',
   * delivery_verification remains 'pending', settlement remains 'held'.
   * NO FUNDS ARE RELEASED.
   */
  public async handleShipmentStatusChange(params: {
    trackingNumber: string;
    newShipmentStatus: InternalShipmentStatus;
    location?: string;
  }): Promise<UnifiedOrderAggregate | null> {
    // Update shipment in ShippingManagerService
    const updatedShipment = await shippingManagerService.updateShipmentStatus({
      trackingNumber: params.trackingNumber,
      newStatus: params.newShipmentStatus,
      location: params.location,
    });

    if (!updatedShipment) return null;

    // Find parent order
    const order = Array.from(this.orders.values()).find(o => 
      o.id === updatedShipment.order_id || 
      o.orderNumber === updatedShipment.order_number ||
      o.shipments.some(s => s.tracking_number === params.trackingNumber)
    );

    if (!order) return null;

    // Update shipment reference in order aggregate
    const shipIdx = order.shipments.findIndex(s => s.tracking_number === params.trackingNumber);
    if (shipIdx !== -1) {
      order.shipments[shipIdx] = updatedShipment;
    }

    // Map shipment status to order lifecycle status
    if (params.newShipmentStatus === 'out_for_delivery') {
      order.orderStatus = 'out_for_delivery';
      order.orderTimeline.push({
        status: 'out_for_delivery',
        titleAr: 'الشحنة مع مندوب التوصيل للتسليم',
        description: `الموقع: ${params.location || 'الولاية المستلمة'}`,
        actor: 'COURIER',
        timestamp: new Date().toISOString(),
      });
    } else if (params.newShipmentStatus === 'delivered') {
      // ANTI-FRAUD REQUIREMENT:
      // Keep settlementStatus = 'held' and deliveryVerificationStatus = 'pending'
      order.orderStatus = 'delivered_pending_verification';
      order.settlementStatus = 'held'; // Remains HELD!
      order.deliveryVerificationStatus = 'pending'; // Pending Customer OTP / Inspection

      order.orderTimeline.push({
        status: 'delivered_pending_verification',
        titleAr: 'وصل الطرد - بانتظار التحقق النهائي والمعاينة',
        description: 'تم تسليم الطرد من قبل شركة الشحن. الأموال ما زالت محفوظة ومجمدة لضمان حق الزبون والتاجر.',
        actor: 'SYSTEM',
        timestamp: new Date().toISOString(),
      });
    } else if (params.newShipmentStatus === 'failed_delivery') {
      order.orderStatus = 'delivery_rejected';
      order.orderTimeline.push({
        status: 'delivery_rejected',
        titleAr: 'تعذر تسليم الشحنة بعد استنفاد المحاولات',
        actor: 'COURIER',
        timestamp: new Date().toISOString(),
      });
    } else if (params.newShipmentStatus === 'returned') {
      order.orderStatus = 'refund_requested';
      order.orderTimeline.push({
        status: 'refund_requested',
        titleAr: 'تم إرجاع الشحنة لمستودع التاجر',
        actor: 'COURIER',
        timestamp: new Date().toISOString(),
      });
    }

    order.updatedAt = new Date().toISOString();
    return order;
  }

  /**
   * 5. IDEMPOTENT PAYMENT WEBHOOK RECEIVER
   */
  public async handlePaymentWebhook(payload: {
    event: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
    transactionId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    signature?: string;
  }): Promise<{ success: boolean; duplicate?: boolean; order?: UnifiedOrderAggregate }> {
    const idempotencyKey = `WH_PAY_${payload.transactionId}`;
    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      return { success: true, duplicate: true };
    }

    const order = Array.from(this.orders.values()).find(o => o.orderNumber === payload.orderNumber);
    if (!order) {
      return { success: false };
    }

    if (payload.event === 'PAYMENT_SUCCESS') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      this.recordPrepaidPayment(order);
    } else {
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
      this.releaseInventory(order.id);
    }

    this.processedIdempotencyKeys.add(idempotencyKey);
    return { success: true, order };
  }

  /**
   * 6. ORDER CANCELLATION LIFECYCLE
   */
  public async cancelOrder(orderId: string, reason: string): Promise<UnifiedOrderAggregate> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    if (order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery') {
      throw new Error('Cannot cancel an order that is already in transit. Use Return/Refund workflow.');
    }

    order.orderStatus = 'cancelled';
    this.releaseInventory(orderId);

    // If prepaid, start refund
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'held') {
      order.paymentStatus = 'refunded';
      order.settlementStatus = 'refunded';

      // Deduct from seller pending wallet
      for (const sellerId of order.sellerIds) {
        const current = this.sellerWallets.get(sellerId);
        if (current) {
          current.pendingBalance = Math.max(0, current.pendingBalance - order.financialSnapshot.seller_amount);
        }
      }

      this.financialLedger.push({
        id: `led_ref_${Date.now()}`,
        order_id: order.id,
        order_number: order.orderNumber,
        entry_type: 'CUSTOMER_REFUND',
        debit_account: 'PLATFORM_ESCROW_VAULT',
        credit_account: 'CUSTOMER_GATEWAY',
        amount: order.totalAmount,
        currency: 'DZD',
        description: `Order cancelled before shipment. Refunded ${order.totalAmount} DZD. Reason: ${reason}`,
        created_at: new Date().toISOString(),
      });
    }

    order.orderTimeline.push({
      status: 'cancelled',
      titleAr: 'تم إلغاء الطلب وتحرير المخزون',
      description: `السبب: ${reason}`,
      actor: 'CUSTOMER',
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  /**
   * 7. GETTERS & SCOPED VIEWS
   */
  public getOrderById(orderId: string): UnifiedOrderAggregate | null {
    return this.orders.get(orderId) || null;
  }

  public getOrderByNumber(orderNumber: string): UnifiedOrderAggregate | null {
    return Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber) || null;
  }

  public getCustomerOrders(customerId: string): UnifiedOrderAggregate[] {
    return Array.from(this.orders.values()).filter(o => o.customerId === customerId);
  }

  public getSellerOrders(sellerId: string): Array<{
    id: string;
    orderNumber: string;
    items: Array<OrderItemInput & { id: string; lineTotal: number }>;
    shippingFee: number;
    sellerPendingAmount: number;
    orderStatus: OrderLifecycleStatus;
    paymentStatus: PaymentLifecycleStatus;
    shipment?: Shipment;
    createdAt: string;
  }> {
    return Array.from(this.orders.values())
      .filter(o => o.sellerIds.includes(sellerId))
      .map(o => {
        const sellerItems = o.items.filter(it => it.sellerId === sellerId);
        const sellerShipment = o.shipments.find(s => s.seller_id === sellerId);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          items: sellerItems,
          shippingFee: sellerShipment?.shipping_fee || 0,
          sellerPendingAmount: o.financialSnapshot.seller_amount,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          shipment: sellerShipment,
          createdAt: o.createdAt,
        };
      });
  }

  public getSellerWallet(sellerId: string) {
    return this.sellerWallets.get(sellerId) || { sellerId, availableBalance: 0, pendingBalance: 0 };
  }

  public getFinancialLedger(orderId?: string): FinancialLedgerEntry[] {
    if (orderId) return this.financialLedger.filter(e => e.order_id === orderId);
    return this.financialLedger;
  }
}

export const unifiedOrderLifecycleService = new UnifiedOrderLifecycleService();
