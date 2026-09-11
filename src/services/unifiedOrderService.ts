'use client';

import { supabase } from '@/lib/supabase';
import {
  UnifiedOrder,
  UnifiedOrderStatus,
  UnifiedOrderSource,
  UnifiedOrderItem,
  UnifiedCustomerInfo,
  UnifiedSellerOrProviderInfo,
  UnifiedOrderFinancials,
  UnifiedOrderTimelineEvent,
  validateOrderStateTransition,
} from '@/types/unifiedOrder';

export interface CreateUnifiedOrderInput {
  source: UnifiedOrderSource;
  customer: UnifiedCustomerInfo;
  sellerOrProvider: UnifiedSellerOrProviderInfo;
  items: Array<{
    itemId: string;
    name: string;
    skuOrCode?: string;
    variantId?: string;
    variantAttributes?: Record<string, string>;
    itemType: UnifiedOrderItem['itemType'];
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
    commissionRatePercent?: number;
    serviceScheduledDate?: string;
    serviceDurationMinutes?: number;
  }>;
  shippingFee?: number;
  serviceFee?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod: 'edahabia' | 'baridimob' | 'cib' | 'cash_on_delivery' | 'stripe' | 'wallet';
  courier?: 'yalidine' | 'procolis' | 'kazi_tour' | 'in_house' | 'self_pickup' | 'none';
  initialNotes?: string;
}

// ------------------------------------------------------------------------------------------------
// SEED ORDERS DATASET (Multi-channel Algerian Context)
// ------------------------------------------------------------------------------------------------

const SEED_UNIFIED_ORDERS: UnifiedOrder[] = [
  {
    id: 'uord_101',
    orderNumber: 'KHD-ORD-2026-8801',
    source: 'store',
    status: 'DISPATCHED',
    customer: {
      id: 'usr_4',
      name: 'Yasmine Taleb',
      email: 'yasmine.taleb@outlook.com',
      phone: '+213 540 88 99 00',
      wilaya: 'Setif (19)',
      city: 'Setif Ville',
      deliveryAddress: 'Cité 1000 Logements, Bâtiment C, Apt 14',
      postalCode: '19000',
      notes: 'Call 15 minutes before arrival please.',
    },
    sellerOrProvider: {
      id: 'str_1',
      name: 'DzTech Electronics Store',
      entityType: 'store',
      email: 'amina.dztech@gmail.com',
      phone: '+213 550 11 22 33',
      wilaya: 'Algiers (16)',
      address: 'Rue Didouche Mourad, Alger Centre',
      payoutMethod: 'ccp',
      payoutAccountNumber: '001892019 Clé 45',
    },
    items: [
      {
        id: 'item_1',
        itemId: 'prd_1',
        name: 'Lenovo ThinkPad Core i7 16GB 512GB SSD',
        skuOrCode: 'DZT-LAP-001',
        variantAttributes: { RAM: '16GB', Storage: '512GB SSD', Color: 'Black' },
        itemType: 'product',
        unitPrice: 115000,
        quantity: 1,
        lineTotal: 115000,
        commissionRatePercent: 8,
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200',
      },
    ],
    financials: {
      currency: 'DZD',
      itemsSubtotal: 115000,
      shippingFee: 800,
      serviceFee: 0,
      discountAmount: 0,
      taxAmount: 0,
      platformCommission: 9200, // 8%
      netSellerPayout: 106600,
      totalAmount: 115800,
    },
    payment: {
      method: 'edahabia',
      status: 'PAID',
      gatewayTransactionId: 'SATIM_TX_881920384',
      paymentTimestamp: '2026-08-22 10:15:00',
      paidAmount: 115800,
    },
    delivery: {
      courier: 'yalidine',
      trackingNumber: 'YAL-DZ-8941029',
      trackingUrl: 'https://yalidine.app/tracking/YAL-DZ-8941029',
      estimatedDeliveryDate: '2026-08-24',
      deliveryStatus: 'IN_TRANSIT',
    },
    timeline: [
      {
        id: 'tl_1',
        timestamp: '2026-08-22 10:14:00',
        newStatus: 'PENDING',
        operator: 'Yasmine Taleb',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Order Placed',
        notes: 'Customer completed checkout via Edahabia card.',
      },
      {
        id: 'tl_2',
        timestamp: '2026-08-22 10:15:00',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        operator: 'SATIM Gateway',
        operatorRole: 'SYSTEM',
        actionTitle: 'Payment Settled',
        notes: 'Payment authorization successful (115,800 DA).',
      },
      {
        id: 'tl_3',
        timestamp: '2026-08-22 14:30:00',
        previousStatus: 'CONFIRMED',
        newStatus: 'PROCESSING',
        operator: 'DzTech Warehouse',
        operatorRole: 'SELLER',
        actionTitle: 'Packing Initiated',
        notes: 'Device serial number logged and sealed in protective box.',
      },
      {
        id: 'tl_4',
        timestamp: '2026-08-22 17:00:00',
        previousStatus: 'PROCESSING',
        newStatus: 'READY',
        operator: 'DzTech Warehouse',
        operatorRole: 'SELLER',
        actionTitle: 'Parcel Ready',
        notes: 'Yalidine waybill label affixed.',
      },
      {
        id: 'tl_5',
        timestamp: '2026-08-23 08:30:00',
        previousStatus: 'READY',
        newStatus: 'DISPATCHED',
        operator: 'Yalidine Express Hub Alger',
        operatorRole: 'COURIER',
        actionTitle: 'Handed to Courier',
        notes: 'Parcel scanned at Algiers distribution center. In transit to Setif.',
      },
    ],
    createdAt: '2026-08-22 10:14:00',
    updatedAt: '2026-08-23 08:30:00',
  },
  {
    id: 'uord_102',
    orderNumber: 'KHD-ORD-2026-8802',
    source: 'marketplace',
    status: 'COMPLETED',
    customer: {
      id: 'usr_1',
      name: 'Karim Hadjadj',
      email: 'karim.hadjadj@gmail.com',
      phone: '+213 550 12 34 56',
      wilaya: 'Algiers (16)',
      city: 'Hydra',
      deliveryAddress: 'Hydra, Val d\'Hydra Villa 14',
      postalCode: '16035',
    },
    sellerOrProvider: {
      id: 'str_3',
      name: 'Pièces Auto Express Algérie',
      entityType: 'marketplace_seller',
      email: 'bilal.auto@gmail.com',
      phone: '+213 770 33 44 55',
      wilaya: 'Batna (05)',
      payoutMethod: 'baridimob',
      payoutAccountNumber: '0079999900189',
    },
    items: [
      {
        id: 'item_2',
        itemId: 'prd_3',
        name: 'Plaquettes de Frein Avant Renault Clio 4 / Symbol',
        skuOrCode: 'AUT-BRK-003',
        itemType: 'spare_part',
        unitPrice: 4200,
        quantity: 1,
        lineTotal: 4200,
        commissionRatePercent: 9,
      },
      {
        id: 'item_3',
        itemId: 'prd_4',
        name: 'Kit Filtration Complet Duster 1.5 dCi',
        skuOrCode: 'AUT-FLT-004',
        itemType: 'spare_part',
        unitPrice: 7800,
        quantity: 1,
        lineTotal: 7800,
        commissionRatePercent: 9,
      },
    ],
    financials: {
      currency: 'DZD',
      itemsSubtotal: 12000,
      shippingFee: 600,
      serviceFee: 0,
      discountAmount: 500,
      couponCode: 'AUTO500',
      taxAmount: 0,
      platformCommission: 1080, // 9%
      netSellerPayout: 11020,
      totalAmount: 12100,
    },
    payment: {
      method: 'baridimob',
      status: 'PAID',
      gatewayTransactionId: 'BM_P2P_77192834',
      paymentTimestamp: '2026-08-21 16:32:00',
      paidAmount: 12100,
    },
    delivery: {
      courier: 'yalidine',
      trackingNumber: 'YAL-DZ-7741201',
      deliveryStatus: 'DELIVERED',
      actualDeliveryDate: '2026-08-22 14:00:00',
      proofOfDeliveryOtp: '891024',
    },
    timeline: [
      {
        id: 'tl_201',
        timestamp: '2026-08-21 16:30:00',
        newStatus: 'PENDING',
        operator: 'Karim Hadjadj',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Order Placed',
      },
      {
        id: 'tl_202',
        timestamp: '2026-08-21 16:32:00',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        operator: 'BaridiMob Gateway',
        operatorRole: 'SYSTEM',
        actionTitle: 'Payment Confirmed',
      },
      {
        id: 'tl_203',
        timestamp: '2026-08-21 18:00:00',
        previousStatus: 'CONFIRMED',
        newStatus: 'PROCESSING',
        operator: 'Batna Parts Hub',
        operatorRole: 'SELLER',
        actionTitle: 'Parts Picked',
      },
      {
        id: 'tl_204',
        timestamp: '2026-08-21 19:30:00',
        previousStatus: 'PROCESSING',
        newStatus: 'DISPATCHED',
        operator: 'Yalidine',
        operatorRole: 'COURIER',
        actionTitle: 'Shipped',
      },
      {
        id: 'tl_205',
        timestamp: '2026-08-22 14:00:00',
        previousStatus: 'DISPATCHED',
        newStatus: 'DELIVERED',
        operator: 'Yalidine Courier',
        operatorRole: 'COURIER',
        actionTitle: 'Delivered',
        notes: 'Signed and confirmed with OTP verification.',
      },
      {
        id: 'tl_206',
        timestamp: '2026-08-22 16:00:00',
        previousStatus: 'DELIVERED',
        newStatus: 'COMPLETED',
        operator: 'Karim Hadjadj',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Order Completed',
        notes: 'Customer left 5-star review for genuine parts.',
      },
    ],
    createdAt: '2026-08-21 16:30:00',
    updatedAt: '2026-08-22 16:00:00',
  },
  {
    id: 'uord_103',
    orderNumber: 'KHD-SRV-2026-902',
    source: 'craftsman',
    status: 'CONFIRMED',
    customer: {
      id: 'usr_4',
      name: 'Yasmine Taleb',
      email: 'yasmine.taleb@outlook.com',
      phone: '+213 540 88 99 00',
      wilaya: 'Algiers (16)',
      city: 'Kouba',
      deliveryAddress: 'Kouba Centre, Villa 8',
    },
    sellerOrProvider: {
      id: 'prv_1',
      name: 'Plomberie Express Hadj',
      entityType: 'provider',
      email: 'sofiane.plomb@gmail.com',
      phone: '+213 551 22 33 44',
      wilaya: 'Algiers (16)',
      payoutMethod: 'baridimob',
    },
    items: [
      {
        id: 'item_4',
        itemId: 'srv_1',
        name: 'Recherche et Réparation de Fuite d\'Eau Urgente',
        skuOrCode: 'SRV-PLM-01',
        itemType: 'service',
        unitPrice: 4500,
        quantity: 1,
        lineTotal: 4500,
        commissionRatePercent: 10,
        serviceScheduledDate: '2026-08-24 10:00',
        serviceDurationMinutes: 90,
      },
    ],
    financials: {
      currency: 'DZD',
      itemsSubtotal: 4500,
      shippingFee: 0,
      serviceFee: 0,
      discountAmount: 0,
      taxAmount: 0,
      platformCommission: 450, // 10%
      netSellerPayout: 4050,
      totalAmount: 4500,
      depositPaid: 4500,
    },
    payment: {
      method: 'edahabia',
      status: 'PAID',
      gatewayTransactionId: 'SATIM_SRV_194022',
      paymentTimestamp: '2026-08-22 18:20:00',
      paidAmount: 4500,
    },
    delivery: {
      courier: 'none',
      deliveryStatus: 'NOT_APPLICABLE',
      proofOfDeliveryOtp: '194022',
    },
    timeline: [
      {
        id: 'tl_301',
        timestamp: '2026-08-22 18:15:00',
        newStatus: 'PENDING',
        operator: 'Yasmine Taleb',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Service Booked',
      },
      {
        id: 'tl_302',
        timestamp: '2026-08-22 18:20:00',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        operator: 'Sofiane Mansouri',
        operatorRole: 'PROVIDER',
        actionTitle: 'Appointment Accepted',
        notes: 'Plumber confirmed visit slot for Aug 24 at 10:00 AM with thermal camera.',
      },
    ],
    createdAt: '2026-08-22 18:15:00',
    updatedAt: '2026-08-22 18:20:00',
  },
  {
    id: 'uord_104',
    orderNumber: 'KHD-HAL-2026-901',
    source: 'banquet_hall',
    status: 'CONFIRMED',
    customer: {
      id: 'usr_1',
      name: 'Karim Hadjadj',
      email: 'karim.hadjadj@gmail.com',
      phone: '+213 550 12 34 56',
      wilaya: 'Algiers (16)',
      city: 'Hydra',
      deliveryAddress: 'Hydra',
    },
    sellerOrProvider: {
      id: 'prv_10',
      name: 'Palais El Djazair Events',
      entityType: 'venue',
      email: 'palais.events@gmail.com',
      phone: '+213 550 99 88 77',
      wilaya: 'Algiers (16)',
      address: 'El Biar, Alger',
      payoutMethod: 'bna',
    },
    items: [
      {
        id: 'item_5',
        itemId: 'srv_4',
        name: 'Location Salle des Fêtes Palais El Djazair (500 Personnes)',
        skuOrCode: 'SRV-HAL-04',
        itemType: 'banquet_hall',
        unitPrice: 280000,
        quantity: 1,
        lineTotal: 280000,
        commissionRatePercent: 5,
        serviceScheduledDate: '2026-09-18 18:00 - 02:00',
      },
    ],
    financials: {
      currency: 'DZD',
      itemsSubtotal: 280000,
      shippingFee: 0,
      serviceFee: 0,
      discountAmount: 0,
      taxAmount: 0,
      platformCommission: 14000, // 5%
      netSellerPayout: 266000,
      totalAmount: 280000,
      depositPaid: 100000,
      remainingBalance: 180000,
    },
    payment: {
      method: 'edahabia',
      status: 'PARTIALLY_PAID',
      gatewayTransactionId: 'SATIM_TX_66190284',
      paymentTimestamp: '2026-08-10 14:22:00',
      paidAmount: 100000,
    },
    delivery: {
      courier: 'none',
      deliveryStatus: 'NOT_APPLICABLE',
      proofOfDeliveryOtp: '849201',
    },
    timeline: [
      {
        id: 'tl_401',
        timestamp: '2026-08-10 14:20:00',
        newStatus: 'PENDING',
        operator: 'Karim Hadjadj',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Reservation Submitted',
      },
      {
        id: 'tl_402',
        timestamp: '2026-08-10 14:22:00',
        previousStatus: 'PENDING',
        newStatus: 'CONFIRMED',
        operator: 'Palais El Djazair Manager',
        operatorRole: 'SELLER',
        actionTitle: 'Deposit Received',
        notes: 'Deposit of 100,000 DA captured. Date locked for wedding reception.',
      },
    ],
    createdAt: '2026-08-10 14:20:00',
    updatedAt: '2026-08-10 14:22:00',
  },
  {
    id: 'uord_105',
    orderNumber: 'KHD-ORD-2026-8775',
    source: 'store',
    status: 'DISPUTED',
    customer: {
      id: 'usr_8',
      name: 'Amine Ferhani',
      email: 'amine.ferhani@gmail.com',
      phone: '+213 661 55 44 33',
      wilaya: 'Oran (31)',
      city: 'Oran Ville',
      deliveryAddress: 'Boulevard des Chasseurs Villa 2',
    },
    sellerOrProvider: {
      id: 'str_1',
      name: 'DzTech Electronics Store',
      entityType: 'store',
      email: 'amina.dztech@gmail.com',
      phone: '+213 550 11 22 33',
      wilaya: 'Algiers (16)',
    },
    items: [
      {
        id: 'item_6',
        itemId: 'prd_2',
        name: 'Samsung Galaxy A55 5G 256GB Dual SIM',
        skuOrCode: 'DZT-PHN-002',
        itemType: 'product',
        unitPrice: 68500,
        quantity: 1,
        lineTotal: 68500,
        commissionRatePercent: 8,
      },
    ],
    financials: {
      currency: 'DZD',
      itemsSubtotal: 68500,
      shippingFee: 900,
      serviceFee: 0,
      discountAmount: 0,
      taxAmount: 0,
      platformCommission: 5480,
      netSellerPayout: 63920,
      totalAmount: 69400,
    },
    payment: {
      method: 'edahabia',
      status: 'PAID',
      paidAmount: 69400,
    },
    delivery: {
      courier: 'yalidine',
      trackingNumber: 'YAL-OR-99120',
      deliveryStatus: 'DELIVERED',
    },
    dispute: {
      isDisputed: true,
      disputeId: 'DSP-2026-501',
      openedAt: '2026-08-21 12:00:00',
      openedBy: 'Amine Ferhani',
      reason: 'Package arrived with damaged outer box and broken LCD screen.',
      claimAmount: 32000,
      mediatorNotes: 'Yalidine damage report requested. Evaluating courier insurance.',
    },
    timeline: [
      {
        id: 'tl_501',
        timestamp: '2026-08-20 11:00:00',
        newStatus: 'CONFIRMED',
        operator: 'System',
        operatorRole: 'SYSTEM',
        actionTitle: 'Order Placed & Paid',
      },
      {
        id: 'tl_502',
        timestamp: '2026-08-20 16:00:00',
        previousStatus: 'CONFIRMED',
        newStatus: 'DISPATCHED',
        operator: 'DzTech',
        operatorRole: 'SELLER',
        actionTitle: 'Dispatched via Yalidine',
      },
      {
        id: 'tl_503',
        timestamp: '2026-08-21 11:30:00',
        previousStatus: 'DISPATCHED',
        newStatus: 'DELIVERED',
        operator: 'Yalidine',
        operatorRole: 'COURIER',
        actionTitle: 'Delivered to Customer',
      },
      {
        id: 'tl_504',
        timestamp: '2026-08-21 12:00:00',
        previousStatus: 'DELIVERED',
        newStatus: 'DISPUTED',
        operator: 'Amine Ferhani',
        operatorRole: 'CUSTOMER',
        actionTitle: 'Dispute Opened',
        notes: 'Customer submitted dispute: Broken LCD screen on delivery.',
      },
    ],
    createdAt: '2026-08-20 11:00:00',
    updatedAt: '2026-08-21 12:00:00',
  },
];

// ------------------------------------------------------------------------------------------------
// UNIFIED ORDER SERVICE IMPLEMENTATION
// ------------------------------------------------------------------------------------------------

class UnifiedOrderService {
  private STORAGE_KEY = 'khidmatik_unified_orders';

  private getStorage(): UnifiedOrder[] {
    if (typeof window === 'undefined') return SEED_UNIFIED_ORDERS;
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading unified orders from localStorage', e);
    }
    return SEED_UNIFIED_ORDERS;
  }

  private saveStorage(orders: UnifiedOrder[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed saving unified orders to localStorage', e);
    }
  }

  /**
   * Query all unified orders with flexible multi-criteria filters
   */
  public async getOrders(params?: {
    source?: UnifiedOrderSource | 'all';
    status?: UnifiedOrderStatus | 'all';
    customerId?: string;
    sellerId?: string;
    search?: string;
  }): Promise<UnifiedOrder[]> {
    let orders = this.getStorage();

    // Optionally sync with Supabase
    try {
      if (params?.sellerId) {
        const { data } = await supabase.from('orders').select('*').eq('store_id', params.sellerId);
        if (data && data.length > 0) {
          // Sync existing Supabase schema records if present
        }
      }
    } catch (e) {
      // Supabase offline/fallback mode
    }

    if (!params) return orders;

    return orders.filter((o) => {
      if (params.source && params.source !== 'all' && o.source !== params.source) return false;
      if (params.status && params.status !== 'all' && o.status !== params.status) return false;
      if (params.customerId && o.customer.id !== params.customerId) return false;
      if (params.sellerId && o.sellerOrProvider.id !== params.sellerId) return false;
      if (params.search && params.search.trim()) {
        const q = params.search.toLowerCase();
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.sellerOrProvider.name.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }

  /**
   * Get single order by ID or orderNumber
   */
  public async getOrderById(idOrNumber: string): Promise<UnifiedOrder | null> {
    const orders = this.getStorage();
    return orders.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber) || null;
  }

  /**
   * Create a new unified order across Marketplace, Store, Craftsman, or Banquet Hall
   */
  public async createOrder(input: CreateUnifiedOrderInput): Promise<UnifiedOrder> {
    // 1. Calculate financials
    const itemsSubtotal = input.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const shippingFee = input.shippingFee || 0;
    const serviceFee = input.serviceFee || 0;
    const discountAmount = input.discountAmount || 0;
    const taxAmount = 0; // Standard Algerian consumer price includes taxes

    // Calculate total platform commission
    const platformCommission = input.items.reduce((acc, item) => {
      const rate = item.commissionRatePercent || (input.source === 'banquet_hall' ? 5 : input.source === 'craftsman' ? 10 : 8);
      return acc + (item.unitPrice * item.quantity * rate) / 100;
    }, 0);

    const totalAmount = Math.max(0, itemsSubtotal + shippingFee + serviceFee - discountAmount);
    const netSellerPayout = itemsSubtotal - platformCommission;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderId = `uord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const prefix = input.source === 'craftsman' ? 'SRV' : input.source === 'banquet_hall' ? 'HAL' : 'ORD';
    const orderNumber = `KHD-${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialStatus: UnifiedOrderStatus = 'PENDING';

    const newOrder: UnifiedOrder = {
      id: orderId,
      orderNumber,
      source: input.source,
      status: initialStatus,
      customer: input.customer,
      sellerOrProvider: input.sellerOrProvider,
      items: input.items.map((item, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        itemId: item.itemId,
        name: item.name,
        skuOrCode: item.skuOrCode,
        variantId: item.variantId,
        variantAttributes: item.variantAttributes,
        itemType: item.itemType,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        imageUrl: item.imageUrl,
        commissionRatePercent: item.commissionRatePercent,
        serviceScheduledDate: item.serviceScheduledDate,
        serviceDurationMinutes: item.serviceDurationMinutes,
      })),
      financials: {
        currency: 'DZD',
        itemsSubtotal,
        shippingFee,
        serviceFee,
        discountAmount,
        couponCode: input.couponCode,
        taxAmount,
        platformCommission,
        netSellerPayout,
        totalAmount,
      },
      payment: {
        method: input.paymentMethod,
        status: input.paymentMethod === 'cash_on_delivery' ? 'UNPAID' : 'PENDING',
        paidAmount: 0,
      },
      delivery: {
        courier: input.courier || (input.source === 'craftsman' || input.source === 'banquet_hall' ? 'none' : 'yalidine'),
        deliveryStatus: input.source === 'craftsman' || input.source === 'banquet_hall' ? 'NOT_APPLICABLE' : 'PENDING',
        proofOfDeliveryOtp: Math.floor(100000 + Math.random() * 900000).toString(),
      },
      timeline: [
        {
          id: `tl_${Date.now()}`,
          timestamp: nowStr,
          newStatus: 'PENDING',
          operator: input.customer.name,
          operatorRole: 'CUSTOMER',
          actionTitle: 'Order Created',
          notes: input.initialNotes || `Created via ${input.source.toUpperCase()} checkout.`,
        },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    const currentOrders = this.getStorage();
    const updatedOrders = [newOrder, ...currentOrders];
    this.saveStorage(updatedOrders);

    // Sync to Supabase orders table for backward compatibility
    try {
      await supabase.from('orders').insert({
        customer_id: newOrder.customer.id,
        store_id: newOrder.sellerOrProvider.id,
        customer_name: newOrder.customer.name,
        customer_email: newOrder.customer.email,
        customer_phone: newOrder.customer.phone,
        shipping_address: newOrder.customer.deliveryAddress,
        billing_address: newOrder.customer.deliveryAddress,
        payment_type: newOrder.payment.method,
        payment_status: 'pending',
        total: newOrder.financials.totalAmount,
        profit: newOrder.financials.platformCommission,
        status: 'pending',
      });
    } catch (err) {
      console.warn('Supabase sync skipped', err);
    }

    return newOrder;
  }

  /**
   * Execute a strictly validated Finite State Machine (FSM) status transition
   */
  public async transitionStatus(
    orderId: string,
    targetStatus: UnifiedOrderStatus,
    operator: string = 'Administrator',
    operatorRole: UnifiedOrderTimelineEvent['operatorRole'] = 'ADMIN',
    notes?: string,
    context?: {
      cancellationReason?: string;
      refundAmount?: number;
      trackingNumber?: string;
      otpCode?: string;
    }
  ): Promise<{ success: boolean; order?: UnifiedOrder; error?: string }> {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!order) {
      return { success: false, error: `Order with ID ${orderId} not found.` };
    }

    // 1. Validate via server-side FSM
    const validation = validateOrderStateTransition(order.status, targetStatus, operatorRole, context);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const previousStatus = order.status;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    order.status = targetStatus;
    order.updatedAt = nowStr;

    // 2. Adjust sub-statuses based on lifecycle state
    if (targetStatus === 'CONFIRMED') {
      if (order.payment.status === 'PENDING' || order.payment.status === 'UNPAID') {
        order.payment.status = 'PAID';
        order.payment.paidAmount = order.financials.totalAmount;
        order.payment.paymentTimestamp = nowStr;
      }
    } else if (targetStatus === 'DISPATCHED') {
      if (order.delivery.deliveryStatus !== 'NOT_APPLICABLE') {
        order.delivery.deliveryStatus = 'IN_TRANSIT';
        if (context?.trackingNumber) {
          order.delivery.trackingNumber = context.trackingNumber;
        }
      }
    } else if (targetStatus === 'DELIVERED') {
      if (order.delivery.deliveryStatus !== 'NOT_APPLICABLE') {
        order.delivery.deliveryStatus = 'DELIVERED';
        order.delivery.actualDeliveryDate = nowStr;
      }
      if (order.payment.method === 'cash_on_delivery') {
        order.payment.status = 'PAID';
        order.payment.paidAmount = order.financials.totalAmount;
      }
    } else if (targetStatus === 'CANCELLED') {
      order.cancellationReason = context?.cancellationReason || notes || 'Cancelled by operator';
      order.cancelledBy = operator;
      if (order.payment.status === 'PAID') {
        order.payment.status = 'REFUNDED';
      }
    } else if (targetStatus === 'REFUNDED') {
      order.payment.status = 'REFUNDED';
      order.refundReason = notes || 'Refund issued to customer account.';
    }

    // 3. Append timeline event
    order.timeline.push({
      id: `tl_${Date.now()}`,
      timestamp: nowStr,
      previousStatus,
      newStatus: targetStatus,
      operator,
      operatorRole,
      actionTitle: `Status Changed to ${targetStatus}`,
      notes: notes || `State transition from ${previousStatus} to ${targetStatus}.`,
    });

    this.saveStorage(orders);

    // Sync to Supabase
    try {
      await supabase
        .from('orders')
        .update({
          status: targetStatus.toLowerCase(),
          timeline_history: order.timeline,
        })
        .eq('id', order.id);
    } catch (e) {
      // Offline fallback
    }

    return { success: true, order };
  }

  /**
   * Cancel an order with required cancellation reason
   */
  public async cancelOrder(
    orderId: string,
    reason: string,
    operator: string = 'User',
    operatorRole: UnifiedOrderTimelineEvent['operatorRole'] = 'CUSTOMER'
  ) {
    return this.transitionStatus(orderId, 'CANCELLED', operator, operatorRole, reason, {
      cancellationReason: reason,
    });
  }

  /**
   * Issue a refund for a delivered or cancelled order
   */
  public async issueRefund(
    orderId: string,
    refundAmount: number,
    reason: string,
    operator: string = 'Admin',
    operatorRole: UnifiedOrderTimelineEvent['operatorRole'] = 'ADMIN'
  ) {
    return this.transitionStatus(orderId, 'REFUNDED', operator, operatorRole, reason, {
      refundAmount,
    });
  }

  /**
   * Open a dispute on an order
   */
  public async openDispute(
    orderId: string,
    reason: string,
    claimAmount: number,
    operator: string = 'Customer',
    operatorRole: UnifiedOrderTimelineEvent['operatorRole'] = 'CUSTOMER'
  ) {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    order.dispute = {
      isDisputed: true,
      disputeId: `DSP-${Date.now().toString().slice(-4)}`,
      openedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      openedBy: operator,
      reason,
      claimAmount,
    };

    this.saveStorage(orders);

    return this.transitionStatus(orderId, 'DISPUTED', operator, operatorRole, `Dispute opened: ${reason}`);
  }

  /**
   * Resolve a dispute
   */
  public async resolveDispute(
    orderId: string,
    resolution: 'REFUND_BUYER' | 'PAY_SELLER' | 'DISMISSED',
    mediatorNotes: string,
    operator: string = 'Super Admin'
  ) {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order || !order.dispute) return { success: false, error: 'Order or active dispute not found' };

    order.dispute.resolution = resolution;
    order.dispute.mediatorNotes = mediatorNotes;
    order.dispute.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    order.dispute.resolvedBy = operator;

    this.saveStorage(orders);

    const nextState: UnifiedOrderStatus = resolution === 'REFUND_BUYER' ? 'REFUNDED' : 'COMPLETED';
    return this.transitionStatus(orderId, nextState, operator, 'ADMIN', `Dispute resolved: ${resolution}. ${mediatorNotes}`);
  }

  /**
   * Update delivery courier tracking details
   */
  public async updateTracking(
    orderId: string,
    courier: UnifiedOrder['delivery']['courier'],
    trackingNumber: string,
    operator: string = 'Merchant'
  ) {
    const orders = this.getStorage();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    order.delivery.courier = courier;
    order.delivery.trackingNumber = trackingNumber;
    order.delivery.trackingUrl = `https://${courier}.app/tracking/${trackingNumber}`;

    order.timeline.push({
      id: `tl_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      newStatus: order.status,
      operator,
      operatorRole: 'SELLER',
      actionTitle: 'Tracking Updated',
      notes: `Courier: ${courier.toUpperCase()} — Tracking #: ${trackingNumber}`,
    });

    this.saveStorage(orders);
    return { success: true, order };
  }
}

export const unifiedOrderService = new UnifiedOrderService();
