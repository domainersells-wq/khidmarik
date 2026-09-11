'use client';

import { supabase } from '@/lib/supabase';
import {
  CustomerOrder,
  CustomerOrderStatus,
  CustomerOrderItemSnapshot,
  CustomerOrderAddressSnapshot,
  OrderStatusHistoryRecord,
  CarrierTrackingStep,
  validateCustomerOrderTransition,
} from '@/types/customerOrder';
import { financialService } from '@/services/financialService';

// ------------------------------------------------------------------------------------------------
// SEED CUSTOMER ORDERS DATASET (AliExpress Style)
// ------------------------------------------------------------------------------------------------

const SEED_CUSTOMER_ORDERS: CustomerOrder[] = [
  {
    id: 'ord_khm_001',
    orderNumber: 'KHM-2026-000001',
    customerId: 'usr_1',
    customerName: 'Karim Hadjadj',
    customerEmail: 'karim.hadjadj@gmail.com',
    customerPhone: '+213 550 12 34 56',
    storeId: 'str_1',
    storeName: 'DzTech Electronics Official',
    storeSlug: 'dztech-electronics',
    sellerId: 'str_1',
    sellerName: 'DzTech Electronics Store',
    sellerPhone: '+213 550 11 22 33',
    status: 'in_transit',
    paymentStatus: 'held_in_escrow',
    fulfillmentStatus: 'shipped',
    items: [
      {
        id: 'item_snap_1',
        productId: 'prd_1',
        sellerId: 'str_1',
        storeId: 'str_1',
        storeName: 'DzTech Electronics Official',
        productName: 'Lenovo ThinkPad X1 Carbon Gen 11 (Core i7 / 16GB / 512GB SSD)',
        productImage: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300',
        sku: 'DZT-LAP-001',
        variantId: 'var_x1_16gb',
        variantName: 'Color: Carbon Black / RAM: 16GB / SSD: 512GB NVMe',
        quantity: 1,
        unitPrice: 115000,
        discountAmount: 0,
        totalPrice: 115000,
      },
      {
        id: 'item_snap_2',
        productId: 'prd_acc_1',
        sellerId: 'str_1',
        storeId: 'str_1',
        storeName: 'DzTech Electronics Official',
        productName: 'Lenovo Wireless Ergonomic Laser Mouse',
        productImage: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300',
        sku: 'DZT-MOU-008',
        variantName: 'Color: Matte Black',
        quantity: 1,
        unitPrice: 3500,
        discountAmount: 500,
        totalPrice: 3000,
      },
    ],
    shippingAddress: {
      recipientName: 'Karim Hadjadj',
      phone: '+213 550 12 34 56',
      country: 'Algeria',
      wilaya: 'Algiers (16)',
      commune: 'Hydra',
      addressLine: 'Val d\'Hydra, Résidence Les Pins, Villa 14',
      postalCode: '16035',
    },
    subtotal: 118000,
    shippingFee: 800,
    discountAmount: 500,
    platformFee: 9440, // 8% commission
    sellerAmount: 108560,
    totalAmount: 118300,
    currency: 'DZD',
    paymentMethod: 'edahabia',
    paymentTransactionId: 'SATIM_TX_881920384',
    shippingProvider: 'yalidine',
    trackingNumber: 'YAL-DZ-8941029',
    trackingUrl: 'https://yalidine.app/tracking/YAL-DZ-8941029',
    estimatedDeliveryDate: '2026-08-25',
    protection: {
      protectionDaysTotal: 15,
      protectionEndsAt: '2026-09-08 10:15:00',
      isEligibleForRefund: true,
      canConfirmReceipt: false, // In transit, cannot confirm yet
      escrowStatus: 'held_in_escrow',
    },
    statusHistory: [
      {
        id: 'hist_1',
        orderId: 'ord_khm_001',
        status: 'pending_payment',
        description: 'Order placed by customer via Khidmatik checkout.',
        changedBy: 'Karim Hadjadj',
        changedByRole: 'CUSTOMER',
        createdAt: '2026-08-22 10:14:00',
      },
      {
        id: 'hist_2',
        orderId: 'ord_khm_001',
        status: 'paid',
        previousStatus: 'pending_payment',
        description: 'Payment authorized via SATIM Edahabia (118,300 DA). Funds placed in secure escrow.',
        changedBy: 'SATIM Gateway',
        changedByRole: 'SYSTEM',
        createdAt: '2026-08-22 10:15:00',
      },
      {
        id: 'hist_3',
        orderId: 'ord_khm_001',
        status: 'processing',
        previousStatus: 'paid',
        description: 'Seller accepted order. Items packed & quality inspected at Algiers depot.',
        changedBy: 'DzTech Warehouse Team',
        changedByRole: 'SELLER',
        createdAt: '2026-08-22 14:30:00',
      },
      {
        id: 'hist_4',
        orderId: 'ord_khm_001',
        status: 'ready_to_ship',
        previousStatus: 'processing',
        description: 'Shipping label created with Yalidine Express. Package awaiting carrier pickup.',
        changedBy: 'DzTech Warehouse Team',
        changedByRole: 'SELLER',
        createdAt: '2026-08-22 17:00:00',
      },
      {
        id: 'hist_5',
        orderId: 'ord_khm_001',
        status: 'shipped',
        previousStatus: 'ready_to_ship',
        description: 'Carrier picked up parcel from merchant hub.',
        changedBy: 'Yalidine Express Algiers Hub',
        changedByRole: 'COURIER',
        createdAt: '2026-08-23 08:30:00',
      },
      {
        id: 'hist_6',
        orderId: 'ord_khm_001',
        status: 'in_transit',
        previousStatus: 'shipped',
        description: 'Parcel in transit through sorting center.',
        changedBy: 'Yalidine Logistics Hub',
        changedByRole: 'COURIER',
        createdAt: '2026-08-23 11:00:00',
      },
    ],
    trackingSteps: [
      { id: 'trk_1', title: 'Order Placed & Paid', location: 'Khidmatik Platform', timestamp: '2026-08-22 10:15', status: 'completed', notes: 'Payment held in escrow' },
      { id: 'trk_2', title: 'Seller Dispatched', location: 'Alger Centre Warehouse', timestamp: '2026-08-22 17:00', status: 'completed', notes: 'Packed & Barcode Affixed' },
      { id: 'trk_3', title: 'Package Received by Yalidine', location: 'Oued Smar Logistics Hub', timestamp: '2026-08-23 08:30', status: 'completed', notes: 'Waybill YAL-DZ-8941029' },
      { id: 'trk_4', title: 'Departed Regional Distribution Center', location: 'Algiers Hub', timestamp: '2026-08-23 11:00', status: 'current', notes: 'En route to local delivery depot' },
      { id: 'trk_5', title: 'Out for Delivery', location: 'Hydra Delivery Station', timestamp: 'Expected 2026-08-25', status: 'pending' },
      { id: 'trk_6', title: 'Delivered to Customer', location: 'Hydra, Algiers', timestamp: 'Expected 2026-08-25', status: 'pending' },
    ],
    createdAt: '2026-08-22 10:14:00',
    updatedAt: '2026-08-23 11:00:00',
  },
  {
    id: 'ord_khm_002',
    orderNumber: 'KHM-2026-000002',
    customerId: 'usr_1',
    customerName: 'Karim Hadjadj',
    customerEmail: 'karim.hadjadj@gmail.com',
    customerPhone: '+213 550 12 34 56',
    storeId: 'str_3',
    storeName: 'Pièces Auto Express Algérie',
    storeSlug: 'pieces-auto-express',
    sellerId: 'str_3',
    sellerName: 'Pièces Auto Express Algérie',
    status: 'delivered',
    paymentStatus: 'held_in_escrow',
    fulfillmentStatus: 'delivered',
    items: [
      {
        id: 'item_snap_3',
        productId: 'prd_3',
        sellerId: 'str_3',
        storeId: 'str_3',
        storeName: 'Pièces Auto Express Algérie',
        productName: 'Plaquettes de Frein Avant Renault Clio 4 / Symbol (Originales Valeo)',
        productImage: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300',
        sku: 'AUT-BRK-003',
        variantName: 'Position: Avant / Marque: Valeo OEM',
        quantity: 1,
        unitPrice: 4200,
        discountAmount: 0,
        totalPrice: 4200,
      },
      {
        id: 'item_snap_4',
        productId: 'prd_4',
        sellerId: 'str_3',
        storeId: 'str_3',
        storeName: 'Pièces Auto Express Algérie',
        productName: 'Kit Filtration Complet Duster 1.5 dCi (Huile + Air + Carburant)',
        productImage: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=300',
        sku: 'AUT-FLT-004',
        variantName: 'Moteur: 1.5 dCi Euro 5/6',
        quantity: 1,
        unitPrice: 7800,
        discountAmount: 0,
        totalPrice: 7800,
      },
    ],
    shippingAddress: {
      recipientName: 'Karim Hadjadj',
      phone: '+213 550 12 34 56',
      country: 'Algeria',
      wilaya: 'Algiers (16)',
      commune: 'Hydra',
      addressLine: 'Val d\'Hydra Villa 14',
      postalCode: '16035',
    },
    subtotal: 12000,
    shippingFee: 600,
    discountAmount: 0,
    platformFee: 1080,
    sellerAmount: 10920,
    totalAmount: 12600,
    currency: 'DZD',
    paymentMethod: 'baridimob',
    paymentTransactionId: 'BM_P2P_77192834',
    shippingProvider: 'yalidine',
    trackingNumber: 'YAL-DZ-7741201',
    trackingUrl: 'https://yalidine.app/tracking/YAL-DZ-7741201',
    estimatedDeliveryDate: '2026-08-23',
    deliveredAt: '2026-08-23 09:15:00',
    protection: {
      protectionDaysTotal: 7,
      protectionEndsAt: '2026-08-30 09:15:00',
      isEligibleForRefund: true,
      canConfirmReceipt: true, // Delivered! Customer can confirm receipt now!
      escrowStatus: 'held_in_escrow',
    },
    statusHistory: [
      {
        id: 'hist_201',
        orderId: 'ord_khm_002',
        status: 'paid',
        description: 'Payment confirmed via BaridiMob. Escrow established.',
        changedBy: 'BaridiMob P2P Daemon',
        changedByRole: 'SYSTEM',
        createdAt: '2026-08-21 16:32:00',
      },
      {
        id: 'hist_202',
        orderId: 'ord_khm_002',
        status: 'shipped',
        previousStatus: 'processing',
        description: 'Shipped from Batna auto parts facility via Yalidine.',
        changedBy: 'Pièces Auto Express',
        changedByRole: 'SELLER',
        createdAt: '2026-08-21 19:30:00',
      },
      {
        id: 'hist_203',
        orderId: 'ord_khm_002',
        status: 'delivered',
        previousStatus: 'in_transit',
        description: 'Delivered to customer address. Awaiting customer confirmation or 7-day auto-release.',
        changedBy: 'Yalidine Courier (Kouba Station)',
        changedByRole: 'COURIER',
        createdAt: '2026-08-23 09:15:00',
      },
    ],
    createdAt: '2026-08-21 16:30:00',
    updatedAt: '2026-08-23 09:15:00',
  },
  {
    id: 'ord_khm_003',
    orderNumber: 'KHM-2026-000003',
    customerId: 'usr_1',
    customerName: 'Karim Hadjadj',
    customerEmail: 'karim.hadjadj@gmail.com',
    customerPhone: '+213 550 12 34 56',
    storeId: 'str_1',
    storeName: 'DzTech Electronics Official',
    storeSlug: 'dztech-electronics',
    sellerId: 'str_1',
    sellerName: 'DzTech Electronics Store',
    status: 'completed',
    paymentStatus: 'released',
    fulfillmentStatus: 'delivered',
    items: [
      {
        id: 'item_snap_5',
        productId: 'prd_2',
        sellerId: 'str_1',
        storeId: 'str_1',
        storeName: 'DzTech Electronics Official',
        productName: 'Samsung Galaxy A55 5G (8GB RAM / 256GB Awesome Navy)',
        productImage: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300',
        sku: 'DZT-PHN-002',
        variantName: 'Color: Awesome Navy / Storage: 256GB',
        quantity: 1,
        unitPrice: 68500,
        discountAmount: 1500,
        totalPrice: 67000,
      },
    ],
    shippingAddress: {
      recipientName: 'Karim Hadjadj',
      phone: '+213 550 12 34 56',
      country: 'Algeria',
      wilaya: 'Algiers (16)',
      commune: 'Hydra',
      addressLine: 'Val d\'Hydra Villa 14',
      postalCode: '16035',
    },
    subtotal: 68500,
    shippingFee: 0, // Free promotion
    discountAmount: 1500,
    platformFee: 5360,
    sellerAmount: 61640,
    totalAmount: 67000,
    currency: 'DZD',
    paymentMethod: 'edahabia',
    paymentTransactionId: 'SATIM_TX_55102934',
    shippingProvider: 'procolis',
    trackingNumber: 'PRO-DZ-991204',
    trackingUrl: 'https://procolis.com/track/PRO-DZ-991204',
    deliveredAt: '2026-08-18 14:00:00',
    completedAt: '2026-08-18 16:30:00',
    protection: {
      protectionDaysTotal: 15,
      protectionEndsAt: '2026-09-02 14:00:00',
      isEligibleForRefund: false,
      canConfirmReceipt: false,
      escrowStatus: 'released_to_seller',
    },
    statusHistory: [
      {
        id: 'hist_301',
        orderId: 'ord_khm_003',
        status: 'paid',
        description: 'Payment verified (67,000 DA). Escrow locked.',
        changedBy: 'SATIM Gateway',
        changedByRole: 'SYSTEM',
        createdAt: '2026-08-16 11:00:00',
      },
      {
        id: 'hist_302',
        orderId: 'ord_khm_003',
        status: 'shipped',
        description: 'Shipped via Procolis courier with tracking # PRO-DZ-991204.',
        changedBy: 'DzTech Warehouse Team',
        changedByRole: 'SELLER',
        createdAt: '2026-08-17 10:00:00',
      },
      {
        id: 'hist_303',
        orderId: 'ord_khm_003',
        status: 'delivered',
        description: 'Customer received package and signed delivery OTP.',
        changedBy: 'Procolis Courier',
        changedByRole: 'COURIER',
        createdAt: '2026-08-18 14:00:00',
      },
      {
        id: 'hist_304',
        orderId: 'ord_khm_003',
        status: 'completed',
        previousStatus: 'delivered',
        description: 'Customer confirmed receipt. Escrow funds released to seller wallet (61,640 DA).',
        changedBy: 'Karim Hadjadj',
        changedByRole: 'CUSTOMER',
        createdAt: '2026-08-18 16:30:00',
      },
    ],
    createdAt: '2026-08-16 11:00:00',
    updatedAt: '2026-08-18 16:30:00',
  },
  {
    id: 'ord_khm_004',
    orderNumber: 'KHM-2026-000004',
    customerId: 'usr_1',
    customerName: 'Karim Hadjadj',
    customerEmail: 'karim.hadjadj@gmail.com',
    customerPhone: '+213 550 12 34 56',
    storeId: 'str_2',
    storeName: 'Mode & Élégance Oranaise',
    storeSlug: 'mode-elegance-oran',
    sellerId: 'str_2',
    sellerName: 'Mode & Élégance Oran',
    status: 'processing',
    paymentStatus: 'held_in_escrow',
    fulfillmentStatus: 'processing',
    items: [
      {
        id: 'item_snap_6',
        productId: 'prd_clo_1',
        sellerId: 'str_2',
        storeId: 'str_2',
        storeName: 'Mode & Élégance Oranaise',
        productName: 'Karakou Algérois Traditionnel Brodé au Fil d\'Or (Fait Main)',
        productImage: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=300',
        sku: 'MOD-KRK-001',
        variantName: 'Taille: 38 (M) / Couleur: Vert Émeraude & Or',
        quantity: 1,
        unitPrice: 48000,
        discountAmount: 0,
        totalPrice: 48000,
      },
    ],
    shippingAddress: {
      recipientName: 'Karim Hadjadj',
      phone: '+213 550 12 34 56',
      country: 'Algeria',
      wilaya: 'Algiers (16)',
      commune: 'Hydra',
      addressLine: 'Val d\'Hydra Villa 14',
      postalCode: '16035',
    },
    subtotal: 48000,
    shippingFee: 700,
    discountAmount: 0,
    platformFee: 3840, // 8%
    sellerAmount: 44160,
    totalAmount: 48700,
    currency: 'DZD',
    paymentMethod: 'edahabia',
    paymentTransactionId: 'SATIM_TX_99201948',
    shippingProvider: 'yalidine',
    protection: {
      protectionDaysTotal: 15,
      protectionEndsAt: '2026-09-07 15:00:00',
      isEligibleForRefund: true,
      canConfirmReceipt: false,
      escrowStatus: 'held_in_escrow',
    },
    statusHistory: [
      {
        id: 'hist_401',
        orderId: 'ord_khm_004',
        status: 'paid',
        description: 'Payment confirmed (48,700 DA). Escrow locked.',
        changedBy: 'SATIM Gateway',
        changedByRole: 'SYSTEM',
        createdAt: '2026-08-23 09:00:00',
      },
      {
        id: 'hist_402',
        orderId: 'ord_khm_004',
        status: 'processing',
        previousStatus: 'paid',
        description: 'Merchant preparing embroidery packaging in Oran atelier.',
        changedBy: 'Mode & Élégance Atelier',
        changedByRole: 'SELLER',
        createdAt: '2026-08-23 10:30:00',
      },
    ],
    createdAt: '2026-08-23 09:00:00',
    updatedAt: '2026-08-23 10:30:00',
  },
];

// ------------------------------------------------------------------------------------------------
// CUSTOMER ORDER SERVICE IMPLEMENTATION
// ------------------------------------------------------------------------------------------------

class CustomerOrderService {
  private STORAGE_KEY = 'khidmatik_customer_orders_v2';

  private getStorage(): CustomerOrder[] {
    if (typeof window === 'undefined') return SEED_CUSTOMER_ORDERS;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading customer orders from localStorage', e);
    }
    return SEED_CUSTOMER_ORDERS;
  }

  private saveStorage(orders: CustomerOrder[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed saving customer orders to localStorage', e);
    }
  }

  /**
   * Add or update customer order in the canonical store
   */
  public addCustomerOrder(order: CustomerOrder): void {
    const orders = this.getStorage();
    const existingIndex = orders.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
    if (existingIndex >= 0) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    this.saveStorage(orders);
  }

  /**
   * Create a new canonical customer order
   */
  public async createCustomerOrder(data: {
    orderNumber?: string;
    customerId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    storeId?: string;
    storeName?: string;
    items: Array<{
      productId: string;
      productName: string;
      productImage?: string;
      sku?: string;
      variantName?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      storeId?: string;
      storeName?: string;
    }>;
    shippingAddress: CustomerOrderAddressSnapshot;
    subtotal: number;
    shippingFee: number;
    discountAmount?: number;
    totalAmount: number;
    paymentMethod: 'edahabia' | 'baridimob' | 'cib' | 'cash_on_delivery' | 'wallet';
    paymentTransactionId?: string;
    shippingProvider?: 'yalidine' | 'procolis' | 'kazi_tour' | 'in_house';
  }): Promise<CustomerOrder> {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderId = `ord_khm_${Date.now()}`;
    const orderNum = data.orderNumber || `KHM-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const items: CustomerOrderItemSnapshot[] = data.items.map((item, idx) => ({
      id: `snap_${Date.now()}_${idx}`,
      productId: item.productId,
      sellerId: item.storeId || data.storeId || 'str_1',
      storeId: item.storeId || data.storeId || 'str_1',
      storeName: item.storeName || data.storeName || 'Khidmatik Partner Store',
      productName: item.productName,
      productImage: item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      sku: item.sku || `SKU-${idx + 1}`,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: 0,
      totalPrice: item.totalPrice || item.unitPrice * item.quantity,
    }));

    const platformFee = Math.round(data.subtotal * 0.08);
    const sellerAmount = data.totalAmount - platformFee;

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber: orderNum,
      customerId: data.customerId || 'usr_1',
      customerName: data.customerName,
      customerEmail: data.customerEmail || 'customer@khidmatik.dz',
      customerPhone: data.customerPhone,
      storeId: data.storeId || 'str_1',
      storeName: data.storeName || (items[0]?.storeName ?? 'Khidmatik Partner Store'),
      sellerId: data.storeId || 'str_1',
      sellerName: data.storeName || (items[0]?.storeName ?? 'Khidmatik Partner Store'),
      status: data.paymentMethod === 'cash_on_delivery' ? 'processing' : 'paid',
      paymentStatus: data.paymentMethod === 'cash_on_delivery' ? 'pending' : 'held_in_escrow',
      fulfillmentStatus: 'processing',
      items,
      shippingAddress: data.shippingAddress,
      subtotal: data.subtotal,
      shippingFee: data.shippingFee,
      discountAmount: data.discountAmount || 0,
      platformFee,
      sellerAmount,
      totalAmount: data.totalAmount,
      currency: 'DZD',
      paymentMethod: data.paymentMethod,
      paymentTransactionId: data.paymentTransactionId || `TX_${Date.now()}`,
      shippingProvider: data.shippingProvider || 'yalidine',
      trackingNumber: `YAL-${Math.floor(1000000 + Math.random() * 9000000)}`,
      trackingUrl: 'https://yalidine.app/tracking',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      protection: {
        protectionDaysTotal: 15,
        protectionEndsAt: new Date(Date.now() + 15 * 86400000).toISOString().replace('T', ' ').substring(0, 19),
        isEligibleForRefund: true,
        canConfirmReceipt: false,
        escrowStatus: 'held_in_escrow',
      },
      statusHistory: [
        {
          id: `hist_${Date.now()}_1`,
          orderId,
          status: data.paymentMethod === 'cash_on_delivery' ? 'processing' : 'paid',
          description: data.paymentMethod === 'cash_on_delivery' 
            ? 'Order created. Payment to be collected upon delivery (COD).' 
            : `Payment received and locked in Khidmatik Escrow Vault (${data.totalAmount.toLocaleString()} DA).`,
          changedBy: 'SYSTEM',
          changedByRole: 'SYSTEM',
          createdAt: nowStr,
        },
      ],
      trackingSteps: [
        {
          id: `trk_${Date.now()}_1`,
          title: 'Order Placed & Confirmed',
          location: 'Khidmatik Marketplace Hub',
          timestamp: nowStr,
          status: 'completed',
          notes: 'Order received by the seller and preparing for dispatch.',
        },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    this.addCustomerOrder(newOrder);
    return newOrder;
  }

  /**
   * Get orders for customer filtered by AliExpress status tabs
   */
  public async getCustomerOrders(params?: {
    customerId?: string;
    tab?: 'all' | 'to_pay' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunds';
    search?: string;
  }): Promise<CustomerOrder[]> {
    const orders = this.getStorage();

    return orders.filter((o) => {
      // Tab filtering
      if (params?.tab && params.tab !== 'all') {
        if (params.tab === 'to_pay' && o.status !== 'pending_payment') return false;
        if (params.tab === 'processing' && !['paid', 'processing', 'ready_to_ship'].includes(o.status)) return false;
        if (params.tab === 'shipped' && !['shipped', 'in_transit', 'out_for_delivery'].includes(o.status)) return false;
        if (params.tab === 'delivered' && o.status !== 'delivered') return false;
        if (params.tab === 'completed' && o.status !== 'completed') return false;
        if (params.tab === 'cancelled' && !['cancelled', 'cancel_requested'].includes(o.status)) return false;
        if (params.tab === 'refunds' && !['refund_requested', 'refund_processing', 'refunded', 'disputed'].includes(o.status)) return false;
      }

      // Search term filtering
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase();
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          o.storeName.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q)));
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Get complete order details by orderId or human-readable orderNumber
   */
  public async getOrderDetails(orderIdOrNumber: string): Promise<CustomerOrder | null> {
    const orders = this.getStorage();
    return orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber) || null;
  }

  /**
   * Customer Confirms Receipt of Order
   * Releases escrow funds to seller wallet and records history
   */
  public async confirmReceipt(
    orderIdOrNumber: string,
    customerName: string = 'Karim Hadjadj'
  ): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    if (order.status !== 'delivered') {
      return {
        success: false,
        error: `Receipt can only be confirmed once order is delivered (Current status: ${order.status}).`,
      };
    }

    const validation = validateCustomerOrderTransition(order.status, 'completed', 'CUSTOMER');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Advance Order Status
    order.status = 'completed';
    order.paymentStatus = 'released';
    order.completedAt = nowStr;
    order.updatedAt = nowStr;
    order.protection.canConfirmReceipt = false;
    order.protection.escrowStatus = 'released_to_seller';

    // 2. Append Status History
    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'completed',
      previousStatus: 'delivered',
      description: `Customer confirmed receipt of goods. Escrow released to ${order.storeName} wallet (${order.sellerAmount.toLocaleString()} DA).`,
      changedBy: customerName,
      changedByRole: 'CUSTOMER',
      createdAt: nowStr,
    });

    this.saveStorage(orders);

    // 3. Trigger Escrow Settlement in Financial Service
    await financialService.settleOrderEscrow(order.id, 'Customer Confirmation (Receipt Verified)');

    return { success: true, order };
  }

  /**
   * Customer Submits a Cancellation Request
   */
  public async cancelOrder(
    orderIdOrNumber: string,
    reason: string,
    customerName: string = 'Customer'
  ): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);

    if (!order) return { success: false, error: 'Order not found' };

    if (!['pending_payment', 'paid', 'processing'].includes(order.status)) {
      return {
        success: false,
        error: 'Order has already shipped and cannot be cancelled directly. Please wait for delivery to request a return/refund.',
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    order.status = 'cancelled';
    order.cancelledAt = nowStr;
    order.cancellationReason = reason;
    order.updatedAt = nowStr;

    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'cancelled',
      description: `Order cancelled by customer: ${reason}`,
      changedBy: customerName,
      changedByRole: 'CUSTOMER',
      createdAt: nowStr,
    });

    this.saveStorage(orders);

    return { success: true, order };
  }

  /**
   * Customer Requests a Refund
   */
  public async requestRefund(
    orderIdOrNumber: string,
    reason: string,
    description: string,
    evidenceUrls: string[] = [],
    customerName: string = 'Customer'
  ): Promise<{ success: boolean; order?: CustomerOrder; error?: string }> {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);

    if (!order) return { success: false, error: 'Order not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    order.status = 'refund_requested';
    order.updatedAt = nowStr;

    order.statusHistory.push({
      id: `hist_${Date.now()}`,
      orderId: order.id,
      status: 'refund_requested',
      description: `Refund requested (${reason}): ${description}`,
      changedBy: customerName,
      changedByRole: 'CUSTOMER',
      metadata: { evidenceUrls },
      createdAt: nowStr,
    });

    this.saveStorage(orders);

    return { success: true, order };
  }
}

export const customerOrderService = new CustomerOrderService();
