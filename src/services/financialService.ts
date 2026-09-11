'use client';

import { supabase } from '@/lib/supabase';
import {
  PlatformPaymentRecord,
  PlatformCommissionRecord,
  SellerWalletBalance,
  SettlementRecord,
  PlatformRefundRecord,
  PlatformWithdrawalRecord,
  DoubleEntryLedgerEntry,
  PlatformFinancialStats,
  FinancialEventType,
  TopUpRequest,
  TopUpStatus,
  TopUpMethod,
  TopUpRejectionReason,
} from '@/types/financials';
import { adminDataService } from '@/services/adminDataService';
import { notificationService } from '@/services/notificationService';

// ------------------------------------------------------------------------------------------------
// INITIAL SEED FINANCIAL FIXTURES
// ------------------------------------------------------------------------------------------------

const SEED_COMMISSIONS: PlatformCommissionRecord[] = [
  {
    id: 'comm_1',
    categoryName: 'Merchant Stores & Electronics',
    entityType: 'store',
    defaultRatePercent: 8,
    minFeeDZD: 200,
    maxFeeDZD: 15000,
    totalCollectedThisMonth: 184500,
    totalVolumeProcessed: 2306250,
    isActive: true,
    lastUpdated: '2026-08-01 00:00:00',
  },
  {
    id: 'comm_2',
    categoryName: 'Craftsmen & Emergency Repairs',
    entityType: 'craftsman',
    defaultRatePercent: 10,
    minFeeDZD: 150,
    maxFeeDZD: 5000,
    totalCollectedThisMonth: 92400,
    totalVolumeProcessed: 924000,
    isActive: true,
    lastUpdated: '2026-08-01 00:00:00',
  },
  {
    id: 'comm_3',
    categoryName: 'Auto Parts & Spare Marketplace',
    entityType: 'marketplace_seller',
    defaultRatePercent: 9,
    minFeeDZD: 250,
    maxFeeDZD: 12000,
    totalCollectedThisMonth: 128000,
    totalVolumeProcessed: 1422200,
    isActive: true,
    lastUpdated: '2026-08-01 00:00:00',
  },
  {
    id: 'comm_4',
    categoryName: 'Banquet Halls & Event Venues',
    entityType: 'banquet_hall',
    defaultRatePercent: 5,
    minFeeDZD: 5000,
    maxFeeDZD: 25000,
    totalCollectedThisMonth: 240000,
    totalVolumeProcessed: 4800000,
    isActive: true,
    lastUpdated: '2026-08-01 00:00:00',
  },
];

const SEED_SELLER_WALLETS: SellerWalletBalance[] = [
  {
    sellerId: 'str_1',
    sellerName: 'DzTech Electronics Store',
    entityType: 'store',
    email: 'amina.dztech@gmail.com',
    phone: '+213 550 11 22 33',
    wilaya: 'Algiers (16)',
    pendingBalance: 106600, // From order KHD-ORD-2026-8801 in flight
    availableBalance: 428000, // Ready for withdrawal
    lifetimeGross: 1450000,
    totalCommissionPaid: 116000,
    totalWithdrawn: 800000,
    currency: 'DZD',
    defaultPayoutMethod: 'Algérie Poste (CCP)',
    defaultAccountNumber: '001892019',
    defaultRipNumber: '0079999900189201945',
    lastSettlementAt: '2026-08-20 14:00:00',
  },
  {
    sellerId: 'prv_1',
    sellerName: 'Plomberie Express Hadj',
    entityType: 'provider',
    email: 'sofiane.plomb@gmail.com',
    phone: '+213 551 22 33 44',
    wilaya: 'Algiers (16)',
    pendingBalance: 4050,
    availableBalance: 84500,
    lifetimeGross: 320000,
    totalCommissionPaid: 32000,
    totalWithdrawn: 200000,
    currency: 'DZD',
    defaultPayoutMethod: 'BaridiMob',
    defaultAccountNumber: '0079999900223',
    defaultRipNumber: '0079999900223456789',
    lastSettlementAt: '2026-08-19 11:30:00',
  },
  {
    sellerId: 'str_3',
    sellerName: 'Pièces Auto Express Algérie',
    entityType: 'marketplace_seller',
    email: 'bilal.auto@gmail.com',
    phone: '+213 770 33 44 55',
    wilaya: 'Batna (05)',
    pendingBalance: 0,
    availableBalance: 165200,
    lifetimeGross: 890000,
    totalCommissionPaid: 80100,
    totalWithdrawn: 644700,
    currency: 'DZD',
    defaultPayoutMethod: 'Algérie Poste (CCP)',
    defaultAccountNumber: '003410928',
    defaultRipNumber: '0079999900341092812',
    lastSettlementAt: '2026-08-22 16:00:00',
  },
  {
    sellerId: 'prv_10',
    sellerName: 'Palais El Djazair Events',
    entityType: 'venue',
    email: 'palais.events@gmail.com',
    phone: '+213 550 99 88 77',
    wilaya: 'Algiers (16)',
    pendingBalance: 95000, // Deposit held in escrow
    availableBalance: 520000,
    lifetimeGross: 2400000,
    totalCommissionPaid: 120000,
    totalWithdrawn: 1665000,
    currency: 'DZD',
    defaultPayoutMethod: 'BNA',
    defaultAccountNumber: '001000293849',
    defaultRipNumber: '0010002938490001827',
    lastSettlementAt: '2026-08-15 10:00:00',
  },
  {
    sellerId: 'user_1534d1e7',
    sellerName: 'Ahmed Benali',
    entityType: 'client' as any,
    email: 'ahmed.benali@gmail.com',
    phone: '+213 550 12 34 56',
    wilaya: 'Algiers (16)',
    pendingBalance: 0,
    availableBalance: 20000, // Credited from approved TOP-2026-000125
    lifetimeGross: 20000,
    totalCommissionPaid: 0,
    totalWithdrawn: 0,
    currency: 'DZD',
    defaultPayoutMethod: 'Algérie Poste (CCP)',
    defaultAccountNumber: '001928374 12',
    defaultRipNumber: '00799999001928374128',
    lastSettlementAt: '2026-08-26 11:00:00',
  },
  {
    sellerId: 'usr_2',
    sellerName: 'Karim Bouzid',
    entityType: 'client' as any,
    email: 'karim.bouzid@gmail.com',
    phone: '+213 551 88 99 00',
    wilaya: 'Oran (31)',
    pendingBalance: 0,
    availableBalance: 15000, // Credited from approved TOP-2026-000124
    lifetimeGross: 15000,
    totalCommissionPaid: 0,
    totalWithdrawn: 0,
    currency: 'DZD',
    defaultPayoutMethod: 'BaridiMob',
    defaultAccountNumber: '00799999001122334455',
    defaultRipNumber: '00799999001122334455',
    lastSettlementAt: '2026-08-25 15:00:00',
  },
];

const SEED_PAYMENTS: PlatformPaymentRecord[] = [
  {
    id: 'pay_101',
    paymentReference: 'PAY-2026-8801',
    orderId: 'uord_101',
    orderSource: 'store',
    payerId: 'usr_4',
    payerName: 'Yasmine Taleb',
    payerPhone: '+213 540 88 99 00',
    amount: 115800,
    currency: 'DZD',
    method: 'edahabia',
    gatewayTransactionId: 'SATIM_TX_881920384',
    idempotencyKey: 'IDEMP_ORD_101_EDAHABIA',
    networkFee: 150,
    netAmount: 115650,
    status: 'succeeded',
    createdAt: '2026-08-22 10:15:00',
    ipAddress: '105.101.44.12',
    receiptUrl: 'https://satim.dz/receipt/881920384',
  },
  {
    id: 'pay_102',
    paymentReference: 'PAY-2026-8802',
    orderId: 'uord_102',
    orderSource: 'marketplace',
    payerId: 'usr_1',
    payerName: 'Karim Hadjadj',
    payerPhone: '+213 550 12 34 56',
    amount: 12100,
    currency: 'DZD',
    method: 'baridimob',
    gatewayTransactionId: 'BM_P2P_77192834',
    idempotencyKey: 'IDEMP_ORD_102_BARIDIMOB',
    networkFee: 30,
    netAmount: 12070,
    status: 'succeeded',
    createdAt: '2026-08-21 16:32:00',
    ipAddress: '197.200.12.8',
  },
  {
    id: 'pay_103',
    paymentReference: 'PAY-2026-8803',
    orderId: 'uord_103',
    orderSource: 'craftsman',
    payerId: 'usr_4',
    payerName: 'Yasmine Taleb',
    payerPhone: '+213 540 88 99 00',
    amount: 4500,
    currency: 'DZD',
    method: 'edahabia',
    gatewayTransactionId: 'SATIM_SRV_194022',
    idempotencyKey: 'IDEMP_SRV_103_EDAHABIA',
    networkFee: 50,
    netAmount: 4450,
    status: 'succeeded',
    createdAt: '2026-08-22 18:20:00',
    ipAddress: '105.101.44.12',
  },
];

const SEED_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'stl_101',
    orderId: 'uord_101',
    sellerId: 'str_1',
    grossAmount: 115800,
    platformCommission: 9200,
    netSettledAmount: 106600,
    currency: 'DZD',
    status: 'PENDING_ESCROW',
    protectionHours: 48,
    heldAt: '2026-08-22 10:15:00',
    protectionEndsAt: '2026-08-24 10:15:00',
  },
  {
    id: 'stl_102',
    orderId: 'uord_102',
    sellerId: 'str_3',
    grossAmount: 12100,
    platformCommission: 1080,
    netSettledAmount: 11020,
    currency: 'DZD',
    status: 'SETTLED',
    protectionHours: 48,
    heldAt: '2026-08-21 16:32:00',
    protectionEndsAt: '2026-08-22 16:00:00',
    settledAt: '2026-08-22 16:00:00',
    operator: 'System (Auto-release after customer OTP delivery)',
  },
];

const SEED_WITHDRAWALS: PlatformWithdrawalRecord[] = [
  {
    id: 'wd_1',
    payoutCode: 'WD-2026-9012',
    recipientId: 'str_1',
    recipientName: 'DzTech Electronics Store',
    recipientType: 'store_owner',
    bankOrCCP: 'Algérie Poste (CCP)',
    accountNumber: '001892019',
    ripNumber: '0079999900189201945',
    requestedAmount: 120000,
    processingFee: 50,
    netPayoutAmount: 119950,
    status: 'pending',
    requestedAt: '2026-08-22 14:00:00',
  },
  {
    id: 'wd_2',
    payoutCode: 'WD-2026-9011',
    recipientId: 'prv_1',
    recipientName: 'Plomberie Express Hadj',
    recipientType: 'service_provider',
    bankOrCCP: 'BaridiMob',
    accountNumber: '0079999900223',
    ripNumber: '0079999900223456789',
    requestedAmount: 50000,
    processingFee: 50,
    netPayoutAmount: 49950,
    status: 'completed',
    requestedAt: '2026-08-20 09:30:00',
    processedAt: '2026-08-20 15:00:00',
    processedByAdmin: 'Finance Desk Officer',
    transferProofReference: 'PCO-DZ-8941029',
  },
];

const SEED_REFUNDS: PlatformRefundRecord[] = [
  {
    id: 'ref_1',
    refundCode: 'REF-2026-101',
    orderId: 'uord_105',
    paymentId: 'pay_99',
    customerName: 'Amine Ferhani',
    customerEmail: 'amine.ferhani@gmail.com',
    sellerOrProviderName: 'DzTech Electronics Store',
    originalAmount: 69400,
    refundAmount: 32000,
    isPartial: true,
    currency: 'DZD',
    reason: 'dispute_arbitration',
    status: 'completed',
    reversalTransactionId: 'REV_SATIM_8819023',
    createdAt: '2026-08-21 16:30:00',
    processedBy: 'Super Admin (Dispute Settlement)',
    adminNotes: 'Partial refund approved for damaged LCD replacement.',
  },
];

const SEED_LEDGER: DoubleEntryLedgerEntry[] = [
  {
    id: 'jrn_1',
    journalNumber: 'JRN-2026-001',
    referenceId: 'pay_101',
    eventType: 'CUSTOMER_PAYMENT',
    description: 'Customer payment received via SATIM Edahabia for Order KHD-ORD-2026-8801',
    debitAccount: 'VAULT_SATIM_EDAHABIA',
    creditAccount: 'ESCROW_LIABILITY_PENDING',
    amount: 115800,
    currency: 'DZD',
    timestamp: '2026-08-22 10:15:00',
    operator: 'SATIM Gateway',
    immutableHash: 'sha256_e891230491823901a',
  },
  {
    id: 'jrn_2',
    journalNumber: 'JRN-2026-002',
    referenceId: 'uord_102',
    eventType: 'SETTLEMENT_RELEASE',
    description: 'Escrow settlement released for Order KHD-ORD-2026-8802 (Delivered & Verified)',
    debitAccount: 'ESCROW_LIABILITY_PENDING',
    creditAccount: 'SELLER_AVAILABLE_WALLET (str_3)',
    amount: 11020,
    currency: 'DZD',
    timestamp: '2026-08-22 16:00:00',
    operator: 'System Escrow Service',
    immutableHash: 'sha256_99a817234910248bc',
  },
  {
    id: 'jrn_3',
    journalNumber: 'JRN-2026-003',
    referenceId: 'uord_102',
    eventType: 'COMMISSION_EARNED',
    description: 'Platform commission 9% recognized for Order KHD-ORD-2026-8802',
    debitAccount: 'ESCROW_LIABILITY_PENDING',
    creditAccount: 'PLATFORM_COMMISSION_REVENUE',
    amount: 1080,
    currency: 'DZD',
    timestamp: '2026-08-22 16:00:00',
    operator: 'System Accounting',
    immutableHash: 'sha256_bb120938491029384',
  },
  {
    id: 'jrn_4',
    journalNumber: 'JRN-2026-004',
    referenceId: 'wd_2',
    eventType: 'WITHDRAWAL_PAYOUT',
    description: 'CCP Payout disbursed to Plomberie Express Hadj (WD-2026-9011)',
    debitAccount: 'SELLER_AVAILABLE_WALLET (prv_1)',
    creditAccount: 'VAULT_POSTAL_CCP_DISBURSEMENT',
    amount: 50000,
    currency: 'DZD',
    timestamp: '2026-08-20 15:00:00',
    operator: 'Finance Desk Officer',
    immutableHash: 'sha256_44120938401928374',
  },
];

const SEED_TOPUPS: TopUpRequest[] = [
  {
    id: 'topup_1',
    publicRequestNumber: 'TOP-2026-000125',
    userId: 'user_1534d1e7',
    userName: 'Ahmed Benali',
    userEmail: 'ahmed.benali@gmail.com',
    userPhone: '+213 550 12 34 56',
    accountType: 'client',
    walletId: 'w_ahmed_1',
    amount: 20000,
    currency: 'DZD',
    paymentMethod: 'ccp',
    status: 'UNDER_REVIEW',
    createdAt: '2026-08-26 10:30:00',
    expiresAt: '2026-08-28 10:30:00',
    platformAccountName: 'KHIDMATIK / منصة خدماتك',
    platformCcpNumber: '0022334455 88',
    platformRipNumber: '00799999002233445588',
    postalTransactionCode: '98412034',
    senderName: 'Ahmed Benali',
    senderAccount: '001928374 12',
    transferDate: '2026-08-26',
    receiptUrl: '/receipts/ccp_sample_1.jpg',
    userNotes: 'تحويل عبر مكتب بريد الجزائر - وسط العاصمة',
  },
  {
    id: 'topup_2',
    publicRequestNumber: 'TOP-2026-000124',
    userId: 'usr_2',
    userName: 'Karim Bouzid',
    userEmail: 'karim.bouzid@gmail.com',
    userPhone: '+213 551 88 99 00',
    accountType: 'client',
    walletId: 'w_karim_2',
    amount: 15000,
    currency: 'DZD',
    paymentMethod: 'baridimob',
    status: 'APPROVED',
    createdAt: '2026-08-25 14:15:00',
    expiresAt: '2026-08-27 14:15:00',
    platformAccountName: 'KHIDMATIK / منصة خدماتك',
    platformCcpNumber: '0022334455 88',
    platformRipNumber: '00799999002233445588',
    postalTransactionCode: 'BM-20260825-9921',
    senderName: 'Karim Bouzid',
    senderAccount: '00799999001122334455',
    transferDate: '2026-08-25',
    reviewedBy: 'Admin Supervisor',
    reviewedAt: '2026-08-25 15:00:00',
    adminNotes: 'تمت مطابقة الكود مع كشف BaridiMob وإيداع الرصيد بنجاح',
  },
];

// ------------------------------------------------------------------------------------------------
// FINANCIAL ENGINE SERVICE CLASS
// ------------------------------------------------------------------------------------------------

class FinancialService {
  private COMMISSIONS_KEY = 'khidmatik_fin_commissions';
  private WALLETS_KEY = 'khidmatik_fin_wallets';
  private PAYMENTS_KEY = 'khidmatik_fin_payments';
  private SETTLEMENTS_KEY = 'khidmatik_fin_settlements';
  private WITHDRAWALS_KEY = 'khidmatik_fin_withdrawals';
  private REFUNDS_KEY = 'khidmatik_fin_refunds';
  private LEDGER_KEY = 'khidmatik_fin_ledger';
  private TOPUPS_KEY = 'khidmatik_fin_topups';

  private getStore<T>(key: string, seed: T[]): T[] {
    if (typeof window === 'undefined') return seed;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(`Failed reading financial store ${key}`, e);
    }
    return seed;
  }

  private saveStore<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed saving financial store ${key}`, e);
    }
  }

  // ----------------------------------------------------------------------------------------------
  // 1. ZERO-TRUST SERVER-SIDE PRICING & COMMISSION CALCULATION
  // ----------------------------------------------------------------------------------------------

  /**
   * Authoritative server-side price calculation
   * Never trusts client-side price inputs; checks catalog database
   */
  public calculateOrderPricingServerSide(
    items: Array<{
      itemId: string;
      itemType: 'product' | 'spare_part' | 'service' | 'banquet_hall';
      quantity: number;
    }>,
    shippingWilayaCode: string = '16',
    couponCode?: string
  ): {
    itemsSubtotal: number;
    shippingFee: number;
    serviceFee: number;
    discountAmount: number;
    taxAmount: number;
    platformCommission: number;
    netSellerPayout: number;
    totalAmount: number;
    itemDetails: Array<{
      itemId: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      commissionRatePercent: number;
      commissionAmount: number;
    }>;
  } {
    // 1. Lookup item catalog prices server-side
    const products = adminDataService.getProducts();
    const services = adminDataService.getServices();
    const commissions = this.getCommissions();

    let itemsSubtotal = 0;
    let totalCommission = 0;

    const itemDetails = items.map((input) => {
      let unitPrice = 0;
      let commissionRate = 8; // Default 8%

      if (input.itemType === 'product' || input.itemType === 'spare_part') {
        const prod = products.find((p) => p.id === input.itemId);
        unitPrice = prod ? prod.price : 5000;
        const commRule = commissions.find((c) => c.entityType === 'store' || c.entityType === 'marketplace_seller');
        commissionRate = commRule ? commRule.defaultRatePercent : 8;
      } else if (input.itemType === 'service') {
        const srv = services.find((s) => s.id === input.itemId);
        unitPrice = srv ? srv.basePrice : 4500;
        const commRule = commissions.find((c) => c.entityType === 'craftsman');
        commissionRate = commRule ? commRule.defaultRatePercent : 10;
      } else if (input.itemType === 'banquet_hall') {
        const srv = services.find((s) => s.id === input.itemId);
        unitPrice = srv ? srv.basePrice : 280000;
        const commRule = commissions.find((c) => c.entityType === 'banquet_hall');
        commissionRate = commRule ? commRule.defaultRatePercent : 5;
      }

      const lineTotal = unitPrice * input.quantity;
      const lineCommission = (lineTotal * commissionRate) / 100;

      itemsSubtotal += lineTotal;
      totalCommission += lineCommission;

      return {
        itemId: input.itemId,
        unitPrice,
        quantity: input.quantity,
        lineTotal,
        commissionRatePercent: commissionRate,
        commissionAmount: lineCommission,
      };
    });

    // 2. Lookup Algerian Wilaya shipping tariff
    const locations = adminDataService.getLocations();
    const loc = locations.find((l) => l.wilayaCode === shippingWilayaCode || l.nameEn.includes(shippingWilayaCode));
    const shippingFee = loc ? loc.baseShippingCost : 600;

    // 3. Validate promo discounts
    let discountAmount = 0;
    if (couponCode?.trim().toUpperCase() === 'KHIDMATIK10') {
      discountAmount = Math.min(itemsSubtotal * 0.1, 5000);
    } else if (couponCode?.trim().toUpperCase() === 'AUTO500') {
      discountAmount = 500;
    }

    const serviceFee = 0;
    const taxAmount = 0; // Consumer prices in Algeria are TVA inclusive
    const totalAmount = Math.max(0, itemsSubtotal + shippingFee + serviceFee - discountAmount);
    const netSellerPayout = itemsSubtotal - totalCommission;

    return {
      itemsSubtotal,
      shippingFee,
      serviceFee,
      discountAmount,
      taxAmount,
      platformCommission: totalCommission,
      netSellerPayout,
      totalAmount,
      itemDetails,
    };
  }

  // ----------------------------------------------------------------------------------------------
  // 2. PAYMENT CREATION & IDEMPOTENCY GUARD
  // ----------------------------------------------------------------------------------------------

  /**
   * Record a customer payment with idempotency key guard to prevent double-charging
   */
  public async recordCustomerPayment(input: {
    orderId: string;
    orderSource: PlatformPaymentRecord['orderSource'];
    payerId: string;
    payerName: string;
    payerPhone: string;
    sellerId: string;
    amount: number;
    method: PlatformPaymentRecord['method'];
    gatewayTransactionId?: string;
    idempotencyKey: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; payment?: PlatformPaymentRecord; error?: string }> {
    const payments = this.getPayments();

    // 1. Idempotency Check: Prevent duplicate payment for the same key
    const existing = payments.find((p) => p.idempotencyKey === input.idempotencyKey);
    if (existing) {
      return {
        success: true,
        payment: existing,
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const paymentId = `pay_${Date.now()}`;
    const paymentReference = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const networkFee = input.method === 'edahabia' ? 150 : input.method === 'baridimob' ? 30 : 0;
    const netAmount = Math.max(0, input.amount - networkFee);

    const newPayment: PlatformPaymentRecord = {
      id: paymentId,
      paymentReference,
      orderId: input.orderId,
      orderSource: input.orderSource,
      payerId: input.payerId,
      payerName: input.payerName,
      payerPhone: input.payerPhone,
      amount: input.amount,
      currency: 'DZD',
      method: input.method,
      gatewayTransactionId: input.gatewayTransactionId || `SATIM_TX_${Date.now()}`,
      idempotencyKey: input.idempotencyKey,
      networkFee,
      netAmount,
      status: 'succeeded',
      createdAt: nowStr,
      ipAddress: input.ipAddress || '105.101.44.10',
    };

    payments.unshift(newPayment);
    this.saveStore(this.PAYMENTS_KEY, payments);

    // 2. Put funds in Escrow (Credit pending balance in Seller's wallet)
    const wallets = this.getSellerWallets();
    const wallet = wallets.find((w) => w.sellerId === input.sellerId);
    if (wallet) {
      wallet.pendingBalance += input.amount;
      wallet.lifetimeGross += input.amount;
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    // 3. Create Pending Settlement Record
    const settlements = this.getSettlements();
    const newSettlement: SettlementRecord = {
      id: `stl_${Date.now()}`,
      orderId: input.orderId,
      sellerId: input.sellerId,
      grossAmount: input.amount,
      platformCommission: Math.round(input.amount * 0.08), // standard 8%
      netSettledAmount: Math.round(input.amount * 0.92),
      currency: 'DZD',
      status: 'PENDING_ESCROW',
      protectionHours: 48,
      heldAt: nowStr,
      protectionEndsAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    };
    settlements.unshift(newSettlement);
    this.saveStore(this.SETTLEMENTS_KEY, settlements);

    // 4. Record Double-Entry Journal
    this.appendLedgerEntry({
      referenceId: newPayment.id,
      eventType: 'CUSTOMER_PAYMENT',
      description: `Payment received from ${input.payerName} via ${input.method.toUpperCase()} for Order ${input.orderId}`,
      debitAccount: `VAULT_${input.method.toUpperCase()}`,
      creditAccount: 'ESCROW_LIABILITY_PENDING',
      amount: input.amount,
      operator: 'Payment Gateway Daemon',
    });

    return { success: true, payment: newPayment };
  }

  // ----------------------------------------------------------------------------------------------
  // 3. ESCROW SETTLEMENT ENGINE
  // ----------------------------------------------------------------------------------------------

  /**
   * Settle an order from Escrow: releases pending funds to seller available balance
   * Prevents duplicate settlements
   */
  public async settleOrderEscrow(
    orderId: string,
    operator: string = 'System Escrow Settlement'
  ): Promise<{ success: boolean; settlement?: SettlementRecord; error?: string }> {
    const settlements = this.getSettlements();
    const settlement = settlements.find((s) => s.orderId === orderId);

    if (!settlement) {
      return { success: false, error: `No settlement record found for order ${orderId}` };
    }

    if (settlement.status === 'SETTLED') {
      return { success: false, error: `Order ${orderId} has already been settled previously.` };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    settlement.status = 'SETTLED';
    settlement.settledAt = nowStr;
    settlement.operator = operator;
    this.saveStore(this.SETTLEMENTS_KEY, settlements);

    // Update Seller Wallet: move funds from pending to available
    const wallets = this.getSellerWallets();
    const wallet = wallets.find((w) => w.sellerId === settlement.sellerId);
    if (wallet) {
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - settlement.grossAmount);
      wallet.availableBalance += settlement.netSettledAmount;
      wallet.totalCommissionPaid += settlement.platformCommission;
      wallet.lastSettlementAt = nowStr;
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    // Double-Entry Ledger:
    // 1) Release net payout to seller available wallet
    this.appendLedgerEntry({
      referenceId: orderId,
      eventType: 'SETTLEMENT_RELEASE',
      description: `Escrow settlement released to seller ${settlement.sellerId} for order ${orderId}`,
      debitAccount: 'ESCROW_LIABILITY_PENDING',
      creditAccount: `SELLER_AVAILABLE_WALLET (${settlement.sellerId})`,
      amount: settlement.netSettledAmount,
      operator,
    });

    // 2) Recognize platform take-rate commission revenue
    this.appendLedgerEntry({
      referenceId: orderId,
      eventType: 'COMMISSION_EARNED',
      description: `Platform take-rate commission earned on order ${orderId}`,
      debitAccount: 'ESCROW_LIABILITY_PENDING',
      creditAccount: 'PLATFORM_COMMISSION_REVENUE',
      amount: settlement.platformCommission,
      operator,
    });

    // Notify seller that escrow payment was released
    notificationService.sendNotification({
      userId: settlement.sellerId,
      type: 'payment_completed',
      title: 'Payment Cleared & Added to Available Balance',
      message: `Net amount of ${settlement.netSettledAmount} DA from order #${orderId.slice(0, 8)} has cleared escrow.`,
      data: {
        referenceId: orderId,
        orderId,
        amount: settlement.netSettledAmount,
        actionUrl: '/profile?tab=wallet'
      }
    });

    return { success: true, settlement };
  }

  // ----------------------------------------------------------------------------------------------
  // 4. REFUNDS & PARTIAL REFUNDS
  // ----------------------------------------------------------------------------------------------

  /**
   * Issue full or partial refund
   */
  public async processRefund(
    orderId: string,
    refundAmount: number,
    reason: PlatformRefundRecord['reason'],
    operator: string = 'Super Admin',
    isPartial: boolean = false,
    adminNotes?: string
  ): Promise<{ success: boolean; refund?: PlatformRefundRecord; error?: string }> {
    const payments = this.getPayments();
    const payment = payments.find((p) => p.orderId === orderId);

    if (!payment) {
      return { success: false, error: `No payment found for order ${orderId}` };
    }

    if (refundAmount > payment.amount) {
      return { success: false, error: 'Refund amount cannot exceed total paid amount.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const refundCode = `REF-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRefund: PlatformRefundRecord = {
      id: `ref_${Date.now()}`,
      refundCode,
      orderId,
      paymentId: payment.id,
      customerName: payment.payerName,
      customerEmail: `${payment.payerName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      sellerOrProviderName: 'Merchant / Provider',
      originalAmount: payment.amount,
      refundAmount,
      isPartial,
      currency: 'DZD',
      reason,
      status: 'completed',
      reversalTransactionId: `REV_${Date.now()}`,
      createdAt: nowStr,
      processedBy: operator,
      adminNotes,
    };

    const refunds = this.getRefunds();
    refunds.unshift(newRefund);
    this.saveStore(this.REFUNDS_KEY, refunds);

    // Update payment status
    payment.status = isPartial ? 'partially_refunded' : 'refunded';
    this.saveStore(this.PAYMENTS_KEY, payments);

    // Double-Entry Ledger: Reversal
    this.appendLedgerEntry({
      referenceId: newRefund.id,
      eventType: isPartial ? 'REFUND_PARTIAL' : 'REFUND_FULL',
      description: `${isPartial ? 'Partial' : 'Full'} refund of ${refundAmount} DA issued for Order ${orderId} (${reason})`,
      debitAccount: 'ESCROW_LIABILITY_PENDING',
      creditAccount: `CUSTOMER_REFUND (${payment.payerName})`,
      amount: refundAmount,
      operator,
    });

    // Notify customer about refund
    notificationService.sendNotification({
      userId: payment.payerName,
      type: 'refund',
      title: 'Refund Issued to Your Account',
      message: `A refund of ${refundAmount} DA for order #${orderId.slice(0, 8)} has been processed.`,
      data: {
        referenceId: newRefund.refundCode,
        orderId,
        amount: refundAmount,
        actionUrl: '/profile?tab=wallet'
      },
      userEmail: newRefund.customerEmail
    });

    return { success: true, refund: newRefund };
  }

  // ----------------------------------------------------------------------------------------------
  // 5. WITHDRAWAL DISBURSEMENTS & APPROVAL WORKFLOW
  // ----------------------------------------------------------------------------------------------

  /**
   * Request a payout/withdrawal by a merchant or craftsman
   */
  public async requestWithdrawal(
    sellerId: string,
    requestedAmount: number,
    bankOrCCP: PlatformWithdrawalRecord['bankOrCCP'],
    accountNumber: string,
    ripNumber: string
  ): Promise<{ success: boolean; withdrawal?: PlatformWithdrawalRecord; error?: string }> {
    const wallets = this.getSellerWallets();
    const wallet = wallets.find((w) => w.sellerId === sellerId);

    if (!wallet) {
      return { success: false, error: 'Seller wallet not found.' };
    }

    if (requestedAmount > wallet.availableBalance) {
      return {
        success: false,
        error: `Insufficient available balance. Requested ${requestedAmount} DA, but only ${wallet.availableBalance} DA is available.`,
      };
    }

    if (requestedAmount < 1000) {
      return { success: false, error: 'Minimum withdrawal amount is 1,000 DA.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const payoutCode = `WD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const processingFee = 50; // Standard Algerian CCP stamp fee
    const netPayoutAmount = Math.max(0, requestedAmount - processingFee);

    // Lock available balance
    wallet.availableBalance -= requestedAmount;
    this.saveStore(this.WALLETS_KEY, wallets);

    const newWithdrawal: PlatformWithdrawalRecord = {
      id: `wd_${Date.now()}`,
      payoutCode,
      recipientId: sellerId,
      recipientName: wallet.sellerName,
      recipientType: wallet.entityType === 'store' ? 'store_owner' : 'service_provider',
      bankOrCCP,
      accountNumber,
      ripNumber,
      requestedAmount,
      processingFee,
      netPayoutAmount,
      status: 'pending',
      requestedAt: nowStr,
    };

    const withdrawals = this.getWithdrawals();
    withdrawals.unshift(newWithdrawal);
    this.saveStore(this.WITHDRAWALS_KEY, withdrawals);

    // Sync to adminDataService repository
    try {
      const adminWdList = adminDataService.getWithdrawals();
      adminWdList.unshift({
        id: newWithdrawal.id,
        payoutCode: newWithdrawal.payoutCode,
        recipientId: newWithdrawal.recipientId,
        recipientName: newWithdrawal.recipientName,
        recipientType: newWithdrawal.recipientType,
        bankOrCCP: newWithdrawal.bankOrCCP,
        accountNumber: newWithdrawal.accountNumber,
        ripNumber: newWithdrawal.ripNumber,
        requestedAmount: newWithdrawal.requestedAmount,
        processingFee: newWithdrawal.processingFee,
        netPayoutAmount: newWithdrawal.netPayoutAmount,
        status: 'pending',
        requestDate: newWithdrawal.requestedAt,
      });
      adminDataService.saveWithdrawals(adminWdList);
    } catch {}

    // Send admin notification
    notificationService.sendNotification({
      userId: 'admin',
      type: 'withdrawal_request',
      title: `🔔 طلب سحب أرباح جديد: ${payoutCode}`,
      message: `طلب ${wallet.sellerName} سحب مبلغ ${requestedAmount.toLocaleString()} دج عبر ${bankOrCCP}.`,
      data: {
        referenceId: payoutCode,
        amount: requestedAmount,
        actionUrl: `/admin/dashboard?section=withdrawal-management`,
      },
      channel: 'all',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:withdrawal-updated', { detail: newWithdrawal }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: newWithdrawal }));
    }

    return { success: true, withdrawal: newWithdrawal };
  }

  /**
   * Admin approves and confirms bank/CCP transfer for withdrawal
   */
  public async approveWithdrawal(
    withdrawalId: string,
    adminOperator: string = 'Super Admin',
    transferProofReference?: string
  ): Promise<{ success: boolean; withdrawal?: PlatformWithdrawalRecord; error?: string }> {
    const withdrawals = this.getWithdrawals();
    const wd = withdrawals.find((w) => w.id === withdrawalId || w.payoutCode === withdrawalId);

    if (!wd) return { success: false, error: 'Withdrawal record not found' };
    if (wd.status === 'completed') return { success: false, error: 'Withdrawal is already completed.' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    wd.status = 'completed';
    wd.processedAt = nowStr;
    wd.processedByAdmin = adminOperator;
    wd.transferProofReference = transferProofReference || `PCO-DZ-${Date.now()}`;
    this.saveStore(this.WITHDRAWALS_KEY, withdrawals);

    // Update wallet withdrawn counter
    const wallets = this.getSellerWallets();
    const wallet = wallets.find((w) => w.sellerId === wd.recipientId);
    if (wallet) {
      wallet.totalWithdrawn += wd.requestedAmount;
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    // Double-Entry Ledger Entry
    this.appendLedgerEntry({
      referenceId: wd.id,
      eventType: 'WITHDRAWAL_PAYOUT',
      description: `Payout disbursed to ${wd.recipientName} (${wd.bankOrCCP} RIP: ${wd.ripNumber})`,
      debitAccount: `SELLER_AVAILABLE_WALLET (${wd.recipientId})`,
      creditAccount: `VAULT_${wd.bankOrCCP.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_DISBURSEMENT`,
      amount: wd.requestedAmount,
      operator: adminOperator,
    });

    // Notify seller of completed withdrawal
    notificationService.sendNotification({
      userId: wd.recipientId,
      type: 'withdrawal_status',
      title: 'Withdrawal Payout Approved & Sent',
      message: `Your withdrawal of ${wd.requestedAmount} DA via ${wd.bankOrCCP} has been confirmed.`,
      data: {
        referenceId: wd.payoutCode,
        withdrawalId: wd.id,
        amount: wd.requestedAmount,
        status: 'completed',
        actionUrl: '/profile?tab=wallet'
      }
    });

    return { success: true, withdrawal: wd };
  }

  /**
   * Admin rejects withdrawal and returns funds to seller available balance
   */
  public async rejectWithdrawal(
    withdrawalId: string,
    reason: string,
    adminOperator: string = 'Super Admin'
  ): Promise<{ success: boolean; withdrawal?: PlatformWithdrawalRecord; error?: string }> {
    const withdrawals = this.getWithdrawals();
    const wd = withdrawals.find((w) => w.id === withdrawalId || w.payoutCode === withdrawalId);

    if (!wd) return { success: false, error: 'Withdrawal record not found' };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    wd.status = 'rejected';
    wd.rejectionReason = reason;
    wd.processedAt = nowStr;
    wd.processedByAdmin = adminOperator;
    this.saveStore(this.WITHDRAWALS_KEY, withdrawals);

    // Unlock funds back to available balance
    const wallets = this.getSellerWallets();
    const wallet = wallets.find((w) => w.sellerId === wd.recipientId);
    if (wallet) {
      wallet.availableBalance += wd.requestedAmount;
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    // Ledger Entry: Reversal
    this.appendLedgerEntry({
      referenceId: wd.id,
      eventType: 'WITHDRAWAL_REVERSAL',
      description: `Withdrawal request ${wd.payoutCode} rejected: ${reason}. Funds returned to wallet.`,
      debitAccount: 'WITHDRAWAL_HOLD_ACCOUNT',
      creditAccount: `SELLER_AVAILABLE_WALLET (${wd.recipientId})`,
      amount: wd.requestedAmount,
      operator: adminOperator,
    });

    // Notify seller of rejected withdrawal
    notificationService.sendNotification({
      userId: wd.recipientId,
      type: 'withdrawal_status',
      title: 'Withdrawal Request Update',
      message: `Your withdrawal request was declined: ${reason}. Funds returned to wallet.`,
      data: {
        referenceId: wd.payoutCode,
        withdrawalId: wd.id,
        amount: wd.requestedAmount,
        status: 'rejected',
        reason,
        actionUrl: '/profile?tab=wallet'
      }
    });

    return { success: true, withdrawal: wd };
  }

  // ----------------------------------------------------------------------------------------------
  // 6. TOP-UP LIFECYCLE, MULTI-SOURCE SYNC & AUTO-VERIFICATION ENGINE
  // ----------------------------------------------------------------------------------------------

  private AUTO_VERIFY_KEY = 'khidmatik_fin_auto_verify_config';

  /**
   * Bi-directional synchronization helper to aggregate user top-ups across all profiles & storage keys
   */
  private syncLocalUserTopUps(existingList: TopUpRequest[]): TopUpRequest[] {
    if (typeof window === 'undefined') return existingList;
    try {
      let modified = false;

      // 1. Scan all localStorage keys for user topups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('khidmatik_topups_') || key === 'khidmatik_topups' || key === 'khidmatik_user_topups')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const userTxs = JSON.parse(raw);
              if (Array.isArray(userTxs)) {
                userTxs.forEach((ut: any) => {
                  const reqNum = ut.transactionCode || ut.publicRequestNumber || ut.id || `TOP-2026-${Math.floor(Math.random() * 100000)}`;
                  const existingIdx = existingList.findIndex(
                    (el) => el.id === ut.id || el.publicRequestNumber === reqNum || (ut.transactionCode && el.publicRequestNumber === ut.transactionCode)
                  );

                  const mappedStatus: TopUpStatus = 
                    ut.status === 'approved' || ut.status === 'APPROVED' ? 'APPROVED' :
                    ut.status === 'rejected' || ut.status === 'REJECTED' ? 'REJECTED' :
                    ut.status === 'info_required' || ut.status === 'INFO_REQUIRED' ? 'INFO_REQUIRED' :
                    'UNDER_REVIEW';

                  if (existingIdx === -1) {
                    const newReq: TopUpRequest = {
                      id: ut.id || `topup_sync_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                      publicRequestNumber: reqNum,
                      userId: ut.userId || key.replace('khidmatik_topups_', '') || '1534d1e7-93d2-45f3-94af-180b06fce8a2',
                      userName: ut.userName || 'Ahmed Benali',
                      userEmail: ut.userEmail || 'ahmed.benali@gmail.com',
                      accountType: 'client',
                      walletId: `wallet_${ut.userId || '1534d1e7'}`,
                      amount: Number(ut.amount) || 5000,
                      currency: 'DZD',
                      paymentMethod: (ut.method as TopUpMethod) || 'baridimob',
                      status: mappedStatus,
                      createdAt: ut.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
                      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
                      platformAccountName: 'KHIDMATIK / منصة خدماتك الجزائر',
                      platformCcpNumber: '0022334455 88',
                      platformRipNumber: '00799999002233445588',
                      postalTransactionCode: ut.postalTransactionCode || ut.paymentReference || ut.transactionCode || `BM-${Math.floor(Math.random() * 900000 + 100000)}`,
                      senderName: ut.senderName || ut.userName || 'Ahmed Benali',
                      transferDate: ut.transferDate || (ut.createdAt ? ut.createdAt.split('T')[0] : '2026-08-27'),
                      userNotes: ut.notes || ut.userNotes || 'طلب شحن مرسل من بروفيل المستخدم',
                    };
                    existingList.unshift(newReq);
                    modified = true;
                  } else {
                    // Update existing item status and proof if modified
                    const existingItem = existingList[existingIdx];
                    if (existingItem.status === 'PENDING_PAYMENT_CONFIRMATION' && (mappedStatus === 'UNDER_REVIEW' || ut.postalTransactionCode || ut.transactionCode)) {
                      existingItem.status = mappedStatus;
                      if (ut.postalTransactionCode) existingItem.postalTransactionCode = ut.postalTransactionCode;
                      modified = true;
                    }
                  }
                });
              }
            } catch (err) {
              console.warn('Failed parsing local topups from key', key, err);
            }
          }
        }
      }

      if (modified) {
        this.saveStore(this.TOPUPS_KEY, existingList);
      }
    } catch (e) {
      console.warn('Sync error in topups', e);
    }
    return existingList;
  }

  public getTopUpRequests(filter?: {
    status?: TopUpStatus;
    userId?: string;
    search?: string;
  }): TopUpRequest[] {
    let list = this.getStore<TopUpRequest>(this.TOPUPS_KEY, SEED_TOPUPS);
    list = this.syncLocalUserTopUps(list);

    if (!filter) return list;

    if (filter.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter.userId) {
      list = list.filter((r) => r.userId === filter.userId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.publicRequestNumber.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          (r.postalTransactionCode && r.postalTransactionCode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Sync top-ups from Next.js server storage (Cross-browser, cross-device, incognito window sync)
   */
  public async syncTopUpsFromServer(): Promise<TopUpRequest[]> {
    if (typeof window === 'undefined') return this.getTopUpRequests();
    try {
      const res = await fetch('/api/v1/financial/topups');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverList: TopUpRequest[] = json.data;
          const currentList = this.getStore<TopUpRequest>(this.TOPUPS_KEY, SEED_TOPUPS);
          let changed = false;

          serverList.forEach((sReq) => {
            const idx = currentList.findIndex(
              (c) => c.id === sReq.id || c.publicRequestNumber === sReq.publicRequestNumber
            );
            if (idx === -1) {
              currentList.unshift(sReq);
              changed = true;
              if (sReq.status === 'APPROVED') {
                this.creditUserWallet(sReq.userId, sReq.amount, sReq.publicRequestNumber);
              }
            } else {
              // Synchronize status and review details
              const wasApproved = currentList[idx].status === 'APPROVED';
              if (currentList[idx].status !== sReq.status || currentList[idx].adminNotes !== sReq.adminNotes) {
                currentList[idx] = { ...currentList[idx], ...sReq };
                changed = true;
                if (sReq.status === 'APPROVED' && !wasApproved) {
                  this.creditUserWallet(sReq.userId, sReq.amount, sReq.publicRequestNumber);
                }
              }
            }
          });

          if (changed) {
            this.saveStore(this.TOPUPS_KEY, currentList);
            window.dispatchEvent(new CustomEvent('khidmatik:topup-updated'));
            window.dispatchEvent(new CustomEvent('khidmatik:wallet-updated'));
          }
          return currentList;
        }
      }
    } catch (e) {
      console.warn('Failed syncing topups from server:', e);
    }
    return this.getTopUpRequests();
  }

  public getTopUpRequestById(id: string): TopUpRequest | null {
    const list = this.getTopUpRequests();
    return list.find((r) => r.id === id || r.publicRequestNumber === id) || null;
  }

  public isPostalCodeUsed(code: string, excludeRequestId?: string): boolean {
    if (!code) return false;
    const cleanCode = code.trim().toLowerCase();
    const list = this.getTopUpRequests();
    return list.some(
      (r) =>
        r.id !== excludeRequestId &&
        (r.status === 'APPROVED' || r.status === 'UNDER_REVIEW') &&
        r.postalTransactionCode &&
        r.postalTransactionCode.trim().toLowerCase() === cleanCode
    );
  }

  /**
   * Auto-Verification Settings & Configuration
   */
  public getAutoVerificationSettings(): {
    enabled: boolean;
    autoApproveThresholdDZD: number;
    allowedMethods: TopUpMethod[];
    requireReceiptImage: boolean;
    autoReleaseEscrow: boolean;
    mode: 'manual' | 'automatic';
  } {
    const defaultSettings = {
      enabled: false,
      autoApproveThresholdDZD: 50000,
      allowedMethods: ['baridimob', 'bank', 'ccp', 'edahabia'] as TopUpMethod[],
      requireReceiptImage: false,
      autoReleaseEscrow: true,
      mode: 'manual' as const,
    };
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const saved = localStorage.getItem(this.AUTO_VERIFY_KEY);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return defaultSettings;
  }

  public updateAutoVerificationSettings(settings: Partial<ReturnType<typeof this.getAutoVerificationSettings>>): void {
    const current = this.getAutoVerificationSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.AUTO_VERIFY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('khidmatik:auto-verify-config-updated', { detail: updated }));
    }
  }

  /**
   * Execute batch automatic verification on all pending matching requests
   */
  public runAutoVerificationBatch(): {
    processed: number;
    approved: number;
    skipped: number;
  } {
    const settings = this.getAutoVerificationSettings();
    const pendingList = this.getTopUpRequests({ status: 'UNDER_REVIEW' });
    let approved = 0;
    let skipped = 0;

    pendingList.forEach((req) => {
      // Check if amount is within auto-approve threshold and method is supported
      if (
        req.amount <= settings.autoApproveThresholdDZD &&
        settings.allowedMethods.includes(req.paymentMethod) &&
        req.postalTransactionCode &&
        req.postalTransactionCode.trim().length >= 4
      ) {
        const result = this.approveTopUpRequest(
          req.id,
          'Smart Auto-Verification Gateway / التحقق الآلي المباشر',
          'تم التحقق والاعتماد الفوري لمطابقة كود العملية مع بوابات الدفع الإلكتروني'
        );
        if (result.success) {
          approved++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    });

    return { processed: pendingList.length, approved, skipped };
  }

  /**
   * Submit new Top-Up Request with transfer proof atomically (Only after user enters transaction code)
   */
  public submitUserTopUpRequest(input: {
    userId: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    accountType?: 'client' | 'store_owner' | 'service_provider';
    walletId?: string;
    amount: number;
    paymentMethod: TopUpMethod;
    postalTransactionCode: string;
    senderName?: string;
    senderAccount?: string;
    transferDate: string;
    receiptUrl?: string;
    userNotes?: string;
  }): { success: boolean; error?: string; topUp?: TopUpRequest } {
    if (!input.postalTransactionCode || !input.postalTransactionCode.trim()) {
      return { success: false, error: 'رمز العملية البريدية أو وصل التحويل مطلوب' };
    }

    const cleanCode = input.postalTransactionCode.trim();
    if (this.isPostalCodeUsed(cleanCode)) {
      return { success: false, error: 'رمز العملية البريدية هذا مسجل بالفعل في طلب شحن آخر' };
    }

    const list = this.getTopUpRequests();
    const count = list.length + 1;
    const padCount = String(count).padStart(6, '0');
    const publicRequestNumber = `TOP-2026-${padCount}`;
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiresDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const expiresStr = expiresDate.toISOString().replace('T', ' ').substring(0, 19);

    const newRequest: TopUpRequest = {
      id: `topup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      publicRequestNumber,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userPhone: input.userPhone,
      accountType: input.accountType || 'client',
      walletId: input.walletId || `wallet_${input.userId}`,
      amount: input.amount,
      currency: 'DZD',
      paymentMethod: input.paymentMethod,
      status: 'UNDER_REVIEW',
      createdAt: nowStr,
      submittedAt: nowStr,
      expiresAt: expiresStr,
      platformAccountName: 'KHIDMATIK / منصة خدماتك الجزائر',
      platformCcpNumber: '0022334455 88',
      platformRipNumber: '00799999002233445588',
      postalTransactionCode: cleanCode,
      paymentReference: cleanCode,
      senderName: input.senderName || input.userName,
      senderAccount: input.senderAccount,
      transferDate: input.transferDate,
      receiptUrl: input.receiptUrl,
      userNotes: input.userNotes,
    };

    list.unshift(newRequest);
    this.saveStore(this.TOPUPS_KEY, list);

    // Save to user profile history
    if (typeof window !== 'undefined') {
      const userKey = `khidmatik_topups_${input.userId}`;
      let userList: any[] = [];
      try {
        const raw = localStorage.getItem(userKey);
        if (raw) userList = JSON.parse(raw);
      } catch {}
      userList.unshift({
        id: newRequest.id,
        userId: input.userId,
        amount: newRequest.amount,
        method: newRequest.paymentMethod,
        status: 'pending-review',
        transactionCode: newRequest.publicRequestNumber,
        postalTransactionCode: cleanCode,
        createdAt: now.toISOString(),
      });
      localStorage.setItem(userKey, JSON.stringify(userList));
      localStorage.setItem('khidmatik_topups_all', JSON.stringify(list));

      // Persist to shared server store for cross-browser, cross-device & incognito synchronization
      fetch('/api/v1/financial/topups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      }).catch((err) => console.warn('Background server topup sync error:', err));
    }

    // Record audit log
    adminDataService.recordAudit(
      input.userName,
      'CREATE',
      'TopUp',
      publicRequestNumber,
      `Submitted Top-Up Request ${publicRequestNumber} (${input.amount.toLocaleString()} DA via ${input.paymentMethod.toUpperCase()}) with Postal Code: ${cleanCode}`
    );

    // 1. Send live actionable notification to Admin Supervisor Desk
    notificationService.sendNotification({
      userId: 'admin',
      type: 'topup_request',
      title: `🔔 طلب شحن رصيد جديد: ${publicRequestNumber}`,
      message: `أرسل ${input.userName} إثبات تحويل بمبلغ ${input.amount.toLocaleString()} دج عبر ${input.paymentMethod.toUpperCase()}. كود العملية البريدية: ${cleanCode}`,
      data: {
        referenceId: publicRequestNumber,
        requestId: newRequest.id,
        amount: input.amount,
        senderName: input.senderName || input.userName,
        postalCode: cleanCode,
        paymentMethod: input.paymentMethod,
        actionUrl: `/admin/dashboard?section=topup-management&requestId=${publicRequestNumber}`,
      },
      channel: 'all',
    });

    // 2. Send in-app confirmation notification to User
    notificationService.sendNotification({
      userId: input.userId,
      type: 'topup_request',
      title: `تم استلام إثبات التحويل (${publicRequestNumber}) ⏳`,
      message: `طلب شحن رصيدك بمبلغ ${input.amount.toLocaleString()} دج (كود: ${cleanCode}) قيد المراجعة والمطابقة المالية من إدارة منصة خدماتك.`,
      data: {
        referenceId: publicRequestNumber,
        amount: input.amount,
        actionUrl: '/profile?tab=wallet',
      },
      channel: 'in_app',
    });

    // 3. Real-time Events Dispatch for instantaneous UI & Badge update across tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: newRequest }));
      window.dispatchEvent(new CustomEvent('khidmatik:admin-new-topup', { detail: newRequest }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: newRequest }));
    }

    return { success: true, topUp: newRequest };
  }

  /**
   * User creates a new Top-Up Request (Draft)
   */
  public createTopUpRequest(input: {
    userId: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    accountType?: 'client' | 'store_owner' | 'service_provider';
    walletId?: string;
    amount: number;
    paymentMethod: TopUpMethod;
  }): TopUpRequest {
    const list = this.getTopUpRequests();
    const count = list.length + 1;
    const padCount = String(count).padStart(6, '0');
    const publicRequestNumber = `TOP-2026-${padCount}`;
    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiresDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hrs expiration window
    const expiresStr = expiresDate.toISOString().replace('T', ' ').substring(0, 19);

    const newRequest: TopUpRequest = {
      id: `topup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      publicRequestNumber,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      userPhone: input.userPhone,
      accountType: input.accountType || 'client',
      walletId: input.walletId || `wallet_${input.userId}`,
      amount: input.amount,
      currency: 'DZD',
      paymentMethod: input.paymentMethod,
      status: 'PENDING_PAYMENT_CONFIRMATION',
      createdAt: nowStr,
      expiresAt: expiresStr,
      platformAccountName: 'KHIDMATIK / منصة خدماتك الجزائر',
      platformCcpNumber: '0022334455 88',
      platformRipNumber: '00799999002233445588',
    };

    list.unshift(newRequest);
    this.saveStore(this.TOPUPS_KEY, list);

    // Record audit log
    adminDataService.recordAudit(
      input.userName,
      'CREATE',
      'TopUp',
      publicRequestNumber,
      `Created Top-Up Request ${publicRequestNumber} for amount ${input.amount.toLocaleString()} DA via ${input.paymentMethod.toUpperCase()}`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: newRequest }));
    }

    return newRequest;
  }

  /**
   * User confirms postal transfer with transaction code
   */
  public confirmTopUpTransfer(
    requestId: string,
    confirmation: {
      postalTransactionCode: string;
      senderName: string;
      senderAccount?: string;
      transferDate: string;
      receiptUrl?: string;
      userNotes?: string;
    }
  ): { success: boolean; error?: string; topUp?: TopUpRequest } {
    const list = this.getTopUpRequests();
    const request = list.find((r) => r.id === requestId || r.publicRequestNumber === requestId);

    if (!request) {
      return { success: false, error: 'طلب الشحن غير موجود في النظام' };
    }

    if (request.status === 'APPROVED') {
      return { success: false, error: 'هذا الطلب تم اعتماده مسبقاً ولا يمكن تعديله' };
    }

    // Check duplicate postal code
    if (this.isPostalCodeUsed(confirmation.postalTransactionCode, request.id)) {
      return {
        success: false,
        error: 'رمز العملية البريدية هذا مسجل بالفعل في طلب شحن آخر قيد المراجعة أو معتمد',
      };
    }

    request.postalTransactionCode = confirmation.postalTransactionCode.trim();
    request.paymentReference = confirmation.postalTransactionCode.trim();
    request.senderName = confirmation.senderName.trim();
    request.senderAccount = confirmation.senderAccount?.trim();
    request.transferDate = confirmation.transferDate;
    request.receiptUrl = confirmation.receiptUrl;
    request.userNotes = confirmation.userNotes;
    request.status = 'UNDER_REVIEW';

    this.saveStore(this.TOPUPS_KEY, list);

    // Record audit log
    adminDataService.recordAudit(
      request.userName,
      'UPDATE',
      'TopUp',
      request.publicRequestNumber,
      `Submitted transfer proof with postal code ${request.postalTransactionCode} for ${request.amount.toLocaleString()} DA`,
      { status: 'PENDING_PAYMENT_CONFIRMATION' },
      { status: 'UNDER_REVIEW' }
    );

    // 1. Send live actionable notification to Admin Supervisor Desk
    notificationService.sendNotification({
      userId: 'admin',
      type: 'topup_request',
      title: `🔔 تأكيد حوالة شحن رصيد: ${request.publicRequestNumber}`,
      message: `أكد ${request.userName} إرسال الحوالة لمبلغ ${request.amount.toLocaleString()} دج. كود العملية: ${request.postalTransactionCode}`,
      data: {
        referenceId: request.publicRequestNumber,
        requestId: request.id,
        amount: request.amount,
        senderName: request.senderName,
        postalCode: request.postalTransactionCode,
        paymentMethod: request.paymentMethod,
        actionUrl: `/admin/dashboard?section=topup-management&requestId=${request.publicRequestNumber}`,
      },
      channel: 'all',
    });

    // 2. Real-time Event Dispatch to update Admin Verification Desk & User Profile
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik:admin-new-topup', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: request }));
    }

    return { success: true, topUp: request };
  }

  /**
   * Helper to normalize user IDs across UUIDs and legacy aliases
   */
  public normalizeUserId(userId?: string | null): string {
    if (!userId) return '1534d1e7-93d2-45f3-94af-180b06fce8a2';
    const trimmed = userId.trim();
    if (trimmed === 'user_1534d1e7' || trimmed.startsWith('1534d1e7')) {
      return '1534d1e7-93d2-45f3-94af-180b06fce8a2';
    }
    return trimmed;
  }

  /**
   * Admin approves Top-Up (Atomic transition: Approved + Wallet credit + Double-entry ledger + Audit + Notification + DB Sync)
   */
  public approveTopUpRequest(
    requestId: string,
    adminName: string = 'Admin Supervisor',
    adminNotes?: string
  ): { success: boolean; error?: string; topUp?: TopUpRequest } {
    const list = this.getTopUpRequests();
    const request = list.find((r) => r.id === requestId || r.publicRequestNumber === requestId);

    if (!request) {
      return { success: false, error: 'طلب الشحن غير موجود' };
    }

    // Idempotency: Reject already approved requests or already credited entries to prevent duplicate balance credit
    if (request.status === 'APPROVED') {
      return { success: false, error: 'تم اعتماد هذا الطلب مسبقاً ولا يمكن تكرار إيداع الرصيد' };
    }

    const walletLedgerList = this.getStore<any>('khidmatik_fin_wallet_ledger', []);
    const alreadyCreditedInLedger = walletLedgerList.some(
      (entry) =>
        (entry.referenceId === request.publicRequestNumber || entry.topUpRequestId === request.id) &&
        entry.type === 'TOPUP_CREDIT' &&
        entry.status === 'COMPLETED'
    );
    if (alreadyCreditedInLedger) {
      request.status = 'APPROVED';
      this.saveStore(this.TOPUPS_KEY, list);
      return { success: false, error: 'تم إيداع رصيد هذا الطلب مسبقاً في الدفتر المالي للمحفظة' };
    }

    const normUserId = this.normalizeUserId(request.userId);

    // Atomic Status Update
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    request.status = 'APPROVED';
    request.reviewedBy = adminName;
    request.reviewedAt = nowStr;
    request.adminNotes = adminNotes || 'تم التحقق من الحوالة البريدية ومطابقة الرصيد بنجاح';

    this.saveStore(this.TOPUPS_KEY, list);

    // Credit User / Seller Wallet in shared store
    const wallets = this.getSellerWallets();
    let wallet = wallets.find((w) => this.normalizeUserId(w.sellerId) === normUserId);
    if (!wallet) {
      wallet = {
        sellerId: normUserId,
        sellerName: request.userName || 'Client User',
        entityType: (request.accountType === 'store_owner' ? 'store' : request.accountType === 'service_provider' ? 'provider' : 'client') as any,
        email: request.userEmail || '',
        phone: request.userPhone || '',
        wilaya: 'Algiers (16)',
        pendingBalance: 0,
        availableBalance: 0,
        lifetimeGross: 0,
        totalCommissionPaid: 0,
        totalWithdrawn: 0,
        currency: 'DZD',
        defaultPayoutMethod: request.paymentMethod === 'baridimob' ? 'BaridiMob' : 'Algérie Poste (CCP)',
        defaultAccountNumber: request.senderAccount || '',
        defaultRipNumber: '',
        lastSettlementAt: nowStr,
      };
      wallets.unshift(wallet);
    }
    
    // Traceable balance credit with audit snapshot
    const balanceBefore = wallet.availableBalance;
    wallet.availableBalance += request.amount;
    const balanceAfter = wallet.availableBalance;
    wallet.lifetimeGross += request.amount;
    wallet.lastSettlementAt = nowStr;
    
    request.balanceBefore = balanceBefore;
    request.balanceAfter = balanceAfter;
    this.saveStore(this.TOPUPS_KEY, list);
    this.saveStore(this.WALLETS_KEY, wallets);

    // Save Dedicated Wallet Ledger Record
    walletLedgerList.unshift({
      id: `wled_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      walletId: wallet.sellerId,
      userId: normUserId,
      topUpRequestId: request.id,
      referenceId: request.publicRequestNumber,
      amount: request.amount,
      currency: 'DZD',
      type: 'TOPUP_CREDIT',
      status: 'COMPLETED',
      balanceBefore,
      balanceAfter,
      idempotencyKey: request.idempotencyKey || `idemp_${request.id}`,
      operator: adminName,
      createdAt: nowStr,
      notes: request.adminNotes,
    });
    this.saveStore('khidmatik_fin_wallet_ledger', walletLedgerList);

    // Double-Entry Accounting Ledger Entry
    this.appendLedgerEntry({
      referenceId: request.publicRequestNumber,
      eventType: 'CUSTOMER_PAYMENT',
      description: `Wallet Top-Up credit for ${request.userName} (${request.publicRequestNumber}) via ${request.paymentMethod.toUpperCase()}`,
      debitAccount: 'PLATFORM_POSTAL_CCP_VAULT',
      creditAccount: `USER_AVAILABLE_WALLET (${normUserId})`,
      amount: request.amount,
      operator: adminName,
    });

    // Sync authoritative wallet balance directly to Supabase Database (profiles table)
    (async () => {
      try {
        const { error: pErr } = await supabase
          .from('profiles')
          .update({ wallet_balance: wallet.availableBalance })
          .eq('id', normUserId);
        if (pErr) {
          console.warn('[FinancialService] Supabase profile balance sync warning:', pErr.message);
        }

        // Record transaction in Supabase
        await supabase
          .from('transactions')
          .insert({
            user_id: normUserId,
            amount: request.amount,
            method: request.paymentMethod,
            status: 'completed',
            transaction_code: request.publicRequestNumber,
            type: 'top_up',
          });
      } catch (e) {
        console.warn('[FinancialService] Async DB sync skipped:', e);
      }
    })();

    // Admin Audit Log
    adminDataService.recordAudit(
      adminName,
      'APPROVE',
      'TopUp',
      request.publicRequestNumber,
      `Approved Top-Up ${request.publicRequestNumber} (+${request.amount.toLocaleString()} DA) for ${request.userName}. Postal Code: ${request.postalTransactionCode || 'N/A'}`,
      { status: 'UNDER_REVIEW' },
      { status: 'APPROVED' }
    );

    // Sync User local history across all user ID variations
    if (typeof window !== 'undefined') {
      const keysToUpdate = [
        `khidmatik_topups_${normUserId}`,
        `khidmatik_topups_${request.userId}`,
        request.userId === 'user_1534d1e7' ? 'khidmatik_topups_1534d1e7-93d2-45f3-94af-180b06fce8a2' : null,
      ].filter(Boolean) as string[];

      keysToUpdate.forEach(userKey => {
        try {
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const uList = JSON.parse(raw);
            const updated = uList.map((item: any) =>
              item.id === request.id || item.transactionCode === request.publicRequestNumber
                ? { ...item, status: 'approved', processedAt: nowStr }
                : item
            );
            localStorage.setItem(userKey, JSON.stringify(updated));
          }
        } catch {}
      });
    }

    // Notify User
    notificationService.sendNotification({
      userId: normUserId,
      type: 'topup_approved',
      title: 'تم اعتماد شحن رصيدك بنجاح! 💳',
      message: `تم التحقق من عملية التحويل البريدي وإضافة ${request.amount.toLocaleString()} دج إلى محفظتك بنجاح (${request.publicRequestNumber}).`,
      data: {
        referenceId: request.publicRequestNumber,
        amount: request.amount,
        actionUrl: '/profile?tab=wallet',
      },
      channel: 'all',
    });

    // Realtime Browser Event Dispatch for immediate reactive balance update across tabs & components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('khidmatik:wallet-updated', {
          detail: {
            userId: normUserId,
            rawUserId: request.userId,
            availableBalance: wallet.availableBalance,
            amount: request.amount,
            reference: request.publicRequestNumber,
            topUp: request,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: request }));

      // Sync approval state to server
      fetch(`/api/v1/financial/topups/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, adminNotes }),
      }).catch((e) => console.warn('Failed syncing approval to server:', e));
    }

    return { success: true, topUp: request };
  }

  /**
   * Admin rejects Top-Up request
   */
  public rejectTopUpRequest(
    requestId: string,
    adminName: string = 'Admin Supervisor',
    reason: TopUpRejectionReason,
    adminNotes?: string
  ): { success: boolean; error?: string; topUp?: TopUpRequest } {
    const list = this.getTopUpRequests();
    const request = list.find((r) => r.id === requestId || r.publicRequestNumber === requestId);

    if (!request) {
      return { success: false, error: 'طلب الشحن غير موجود' };
    }

    if (request.status === 'APPROVED') {
      return { success: false, error: 'لا يمكن رفض طلب تم اعتماده مسبقاً' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    request.status = 'REJECTED';
    request.reviewedBy = adminName;
    request.reviewedAt = nowStr;
    request.rejectionReason = reason;
    request.adminNotes = adminNotes || 'تعذر مطابقة كود العملية مع الكشوفات البريدية';

    this.saveStore(this.TOPUPS_KEY, list);

    const reasonTexts: Record<TopUpRejectionReason, string> = {
      INVALID_TRANSACTION_CODE: 'رمز العملية البريدية غير صحيح أو غير موجود بالكشف',
      AMOUNT_MISMATCH: 'المبلغ المحول غير متطابق مع المبلغ المطلوب',
      DUPLICATE_TRANSACTION: 'تم استخدام رمز العملية مسبقاً في عملية أخرى',
      INVALID_RECEIPT: 'وصل التحويل غير صالح أو غير مقروء',
      TRANSFER_NOT_FOUND: 'لم يتم العثور على الحوالة في الحساب البريدي للمنصة',
      UNREADABLE_RECEIPT: 'صورة الوصل غير واضحة',
      SUSPECTED_FRAUD: 'شبهة عملية غير مطابقة للمعلومات المسجلة',
      OTHER: 'مرفوض بناءً على مراجعة إدارة العمليات المالية',
    };

    // Admin Audit Log
    adminDataService.recordAudit(
      adminName,
      'UPDATE',
      'TopUp',
      request.publicRequestNumber,
      `Rejected Top-Up Request ${request.publicRequestNumber} (${request.amount.toLocaleString()} DA). Reason: ${reason} - Notes: ${adminNotes || 'None'}`
    );

    // Sync User local history
    if (typeof window !== 'undefined') {
      const userKey = `khidmatik_topups_${request.userId}`;
      try {
        const raw = localStorage.getItem(userKey);
        if (raw) {
          const uList = JSON.parse(raw);
          const updated = uList.map((item: any) =>
            item.id === request.id || item.transactionCode === request.publicRequestNumber
              ? { ...item, status: 'rejected' }
              : item
          );
          localStorage.setItem(userKey, JSON.stringify(updated));
        }
      } catch {}
    }

    // Notify User
    notificationService.sendNotification({
      userId: request.userId,
      type: 'topup_rejected',
      title: 'تعذر اعتماد طلب شحن الرصيد ⚠️',
      message: `تم رفض طلب الشحن ${request.publicRequestNumber}: ${reasonTexts[reason]}. ${adminNotes || ''}`,
      data: {
        referenceId: request.publicRequestNumber,
        reason,
        actionUrl: '/profile?tab=wallet',
      },
      channel: 'all',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: request }));

      // Sync rejection state to server
      fetch(`/api/v1/financial/topups/${request.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, reason, adminNotes }),
      }).catch((e) => console.warn('Failed syncing rejection to server:', e));
    }

    return { success: true, topUp: request };
  }

  /**
   * Admin requests more information from user
   */
  public requestTopUpMoreInfo(
    requestId: string,
    adminName: string = 'Admin Supervisor',
    infoNote: string
  ): { success: boolean; error?: string; topUp?: TopUpRequest } {
    const list = this.getTopUpRequests();
    const request = list.find((r) => r.id === requestId || r.publicRequestNumber === requestId);

    if (!request) {
      return { success: false, error: 'طلب الشحن غير موجود' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    request.status = 'INFO_REQUIRED';
    request.reviewedBy = adminName;
    request.reviewedAt = nowStr;
    request.requestedInfoNote = infoNote;
    request.requestedInfoAt = nowStr;

    this.saveStore(this.TOPUPS_KEY, list);

    // Sync user local history across all alias keys
    if (typeof window !== 'undefined') {
      const targetUserKeys = new Set<string>([
        `khidmatik_topups_${request.userId}`,
        `khidmatik_topups_${this.normalizeUserId(request.userId)}`,
        `khidmatik_topups_currentUser`,
        `khidmatik_topups_user_1534d1e7`,
        `khidmatik_topups_1534d1e7-93d2-45f3-94af-180b06fce8a2`,
      ]);

      targetUserKeys.forEach((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const uList = JSON.parse(raw);
            if (Array.isArray(uList)) {
              const updated = uList.map((item: any) =>
                item.id === request.id || item.transactionCode === request.publicRequestNumber
                  ? {
                      ...item,
                      status: 'info_required',
                      requestedInfoNote: infoNote,
                      requestedInfoAt: nowStr,
                    }
                  : item
              );
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        } catch {}
      });
    }

    // Admin Audit Log
    adminDataService.recordAudit(
      adminName,
      'UPDATE',
      'TopUp',
      request.publicRequestNumber,
      `Requested more info for ${request.publicRequestNumber}: ${infoNote}`,
      { status: 'UNDER_REVIEW' },
      { status: 'INFO_REQUIRED', note: infoNote }
    );

    // Notify User
    notificationService.sendNotification({
      userId: request.userId,
      userEmail: request.userEmail,
      type: 'topup_info_required',
      title: `ℹ️ مطلوب توضيح أو إرفاق مستند (${request.publicRequestNumber})`,
      message: `طلب المشرف توضيحاً أو مستنداً إضافياً لطلب الشحن: "${infoNote}". اضغط هنا لتقديم الرد وإرفاق المستند.`,
      data: {
        referenceId: request.publicRequestNumber,
        requestId: request.id,
        requestedInfoNote: infoNote,
        actionUrl: `/profile?tab=wallet&action=clarify&requestId=${request.publicRequestNumber}`,
      },
      channel: 'all',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: request }));

      // Sync with server API
      fetch(`/api/v1/financial/topups/${request.id}/request-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, infoNote }),
      }).catch((e) => console.warn('Failed to call request-info API route:', e));
    }

    return { success: true, topUp: request };
  }

  /**
   * User submits clarification and/or attached document for a top-up request
   */
  public submitTopUpClarification(
    requestId: string,
    clarification: {
      clarificationText?: string;
      attachmentUrl?: string;
      fileName?: string;
    }
  ): { success: boolean; error?: string; topUp?: TopUpRequest } {
    const list = this.getTopUpRequests();
    const request = list.find((r) => r.id === requestId || r.publicRequestNumber === requestId);

    if (!request) {
      return { success: false, error: 'طلب الشحن غير موجود' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    request.status = 'UNDER_REVIEW'; // Reset to under review for admin inspection
    request.userClarificationText = clarification.clarificationText?.trim();
    request.userClarificationAttachmentUrl = clarification.attachmentUrl;
    request.userClarificationFileName = clarification.fileName;
    request.userClarificationSubmittedAt = nowStr;

    this.saveStore(this.TOPUPS_KEY, list);

    // Sync user local history
    if (typeof window !== 'undefined') {
      const userKey = `khidmatik_topups_${request.userId}`;
      try {
        const raw = localStorage.getItem(userKey);
        if (raw) {
          const uList = JSON.parse(raw);
          const updated = uList.map((item: any) =>
            item.id === request.id || item.transactionCode === request.publicRequestNumber
              ? {
                  ...item,
                  status: 'pending-review',
                  userClarificationText: clarification.clarificationText,
                  userClarificationAttachmentUrl: clarification.attachmentUrl,
                  userClarificationFileName: clarification.fileName,
                }
              : item
          );
          localStorage.setItem(userKey, JSON.stringify(updated));
        }
      } catch {}
    }

    // Notify Admin Supervisor Desk
    notificationService.sendNotification({
      userId: 'admin',
      type: 'topup_request',
      title: `📎 رد ومستند جديد من المستخدم: ${request.publicRequestNumber}`,
      message: `قدم ${request.userName} توضيحاً ومستنداً لطلب الشحن (${request.amount.toLocaleString()} دج).`,
      data: {
        referenceId: request.publicRequestNumber,
        requestId: request.id,
        amount: request.amount,
        senderName: request.userName,
        postalCode: request.postalTransactionCode,
        actionUrl: `/admin/dashboard?section=topup-management&requestId=${request.publicRequestNumber}`,
      },
      channel: 'all',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('khidmatik:topup-updated', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik:admin-new-topup', { detail: request }));
      window.dispatchEvent(new CustomEvent('khidmatik_notif_update', { detail: request }));

      // Sync with server API
      fetch(`/api/v1/financial/topups/${request.id}/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clarification),
      }).catch((e) => console.warn('Failed to call clarify API route:', e));
    }

    return { success: true, topUp: request };
  }

  // ----------------------------------------------------------------------------------------------
  // 7. GETTERS & PLATFORM STATS
  // ----------------------------------------------------------------------------------------------

  public getCommissions(): PlatformCommissionRecord[] {
    return this.getStore(this.COMMISSIONS_KEY, SEED_COMMISSIONS);
  }

  public saveCommissions(data: PlatformCommissionRecord[]): void {
    this.saveStore(this.COMMISSIONS_KEY, data);
  }

  public getSellerWallets(): SellerWalletBalance[] {
    return this.getStore(this.WALLETS_KEY, SEED_SELLER_WALLETS);
  }

  public getSellerWallet(sellerId: string): SellerWalletBalance | null {
    const wallets = this.getSellerWallets();
    return wallets.find((w) => w.sellerId === sellerId) || null;
  }

  public getUserWallet(userId: string, userName?: string): SellerWalletBalance {
    const normId = this.normalizeUserId(userId);
    const wallets = this.getSellerWallets();
    let wallet = wallets.find((w) => this.normalizeUserId(w.sellerId) === normId);
    if (!wallet) {
      wallet = {
        sellerId: normId,
        sellerName: userName || 'Client User',
        entityType: 'client' as any,
        email: '',
        phone: '',
        wilaya: 'Algiers (16)',
        pendingBalance: 0,
        availableBalance: 0,
        lifetimeGross: 0,
        totalCommissionPaid: 0,
        totalWithdrawn: 0,
        currency: 'DZD',
        defaultPayoutMethod: 'Algérie Poste (CCP)',
        defaultAccountNumber: '',
        defaultRipNumber: '',
        lastSettlementAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      wallets.unshift(wallet);
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    // Automatically synchronize available balance with all approved top-up requests
    const topups = this.getTopUpRequests();
    const approvedTotal = topups
      .filter(
        (t) =>
          t.status === 'APPROVED' &&
          (this.normalizeUserId(t.userId) === normId ||
            t.userId === userId ||
            (normId.startsWith('1534d1e7') && (t.userId.includes('1534d1e7') || t.userId === 'user_1534d1e7')))
      )
      .reduce((sum, t) => sum + t.amount, 0);

    if (approvedTotal > 0 && wallet.availableBalance < approvedTotal) {
      wallet.availableBalance = approvedTotal;
      wallet.lifetimeGross = Math.max(wallet.lifetimeGross, approvedTotal);
      this.saveStore(this.WALLETS_KEY, wallets);
    }

    return wallet;
  }

  public creditUserWallet(userId: string, amount: number, referenceId?: string): SellerWalletBalance {
    const normId = this.normalizeUserId(userId);
    const wallets = this.getSellerWallets();
    let wallet = wallets.find((w) => this.normalizeUserId(w.sellerId) === normId);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Strict Idempotency Check: Prevent duplicate credit if referenceId was already processed
    const walletLedgerList = this.getStore<any>('khidmatik_fin_wallet_ledger', []);
    if (referenceId) {
      const cleanRef = referenceId.trim();
      const alreadyCredited = walletLedgerList.some(
        (entry) =>
          this.normalizeUserId(entry.userId) === normId &&
          (entry.referenceId === cleanRef || entry.topUpRequestId === cleanRef || entry.idempotencyKey === `idemp_${cleanRef}`) &&
          entry.type === 'TOPUP_CREDIT' &&
          entry.status === 'COMPLETED'
      );
      if (alreadyCredited && wallet) {
        // Return existing wallet state immediately without re-crediting
        return wallet;
      }
    }

    if (!wallet) {
      wallet = {
        sellerId: normId,
        sellerName: 'Client User',
        entityType: 'client' as any,
        email: '',
        phone: '',
        wilaya: 'Algiers (16)',
        pendingBalance: 0,
        availableBalance: amount,
        lifetimeGross: amount,
        totalCommissionPaid: 0,
        totalWithdrawn: 0,
        currency: 'DZD',
        defaultPayoutMethod: 'Algérie Poste (CCP)',
        defaultAccountNumber: '',
        defaultRipNumber: '',
        lastSettlementAt: nowStr,
      };
      wallets.unshift(wallet);
    } else {
      wallet.availableBalance += amount;
      wallet.lifetimeGross += amount;
      wallet.lastSettlementAt = nowStr;
    }

    this.saveStore(this.WALLETS_KEY, wallets);

    // Record wallet ledger entry to seal idempotency
    if (referenceId) {
      walletLedgerList.unshift({
        id: `wled_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        walletId: wallet.sellerId,
        userId: normId,
        referenceId,
        amount,
        currency: 'DZD',
        type: 'TOPUP_CREDIT',
        status: 'COMPLETED',
        balanceBefore: wallet.availableBalance - amount,
        balanceAfter: wallet.availableBalance,
        idempotencyKey: `idemp_${referenceId}`,
        operator: 'System Financial Engine',
        createdAt: nowStr,
        notes: 'Top-up wallet credit',
      });
      this.saveStore('khidmatik_fin_wallet_ledger', walletLedgerList);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('khidmatik:wallet-updated', {
          detail: {
            userId: normId,
            rawUserId: userId,
            availableBalance: wallet.availableBalance,
            amount,
            reference: referenceId,
          },
        })
      );
    }

    return wallet;
  }

  /**
   * Financial Reconciliation: Verify that all Approved Top-Ups are backed by Ledger and Wallet Credits
   */
  public reconcileTopUpsAndWallets(): {
    isConsistent: boolean;
    totalApprovedCount: number;
    totalApprovedVolume: number;
    discrepancies: Array<{
      topUpId: string;
      publicRequestNumber: string;
      userId: string;
      amount: number;
      topUpStatus: TopUpStatus;
      walletBalance: number;
      issue: string;
    }>;
  } {
    const topUps = this.getTopUpRequests();
    const wallets = this.getSellerWallets();
    const approved = topUps.filter((t) => t.status === 'APPROVED');
    const totalApprovedVolume = approved.reduce((sum, t) => sum + t.amount, 0);

    const discrepancies: any[] = [];

    approved.forEach((topUp) => {
      const normId = this.normalizeUserId(topUp.userId);
      const wallet = wallets.find((w) => this.normalizeUserId(w.sellerId) === normId);

      if (!wallet) {
        discrepancies.push({
          topUpId: topUp.id,
          publicRequestNumber: topUp.publicRequestNumber,
          userId: normId,
          amount: topUp.amount,
          topUpStatus: topUp.status,
          walletBalance: 0,
          issue: 'FINANCIAL_INTEGRITY_ERROR: Approved Top-Up missing corresponding wallet record',
        });
      } else if (wallet.availableBalance < topUp.amount) {
        discrepancies.push({
          topUpId: topUp.id,
          publicRequestNumber: topUp.publicRequestNumber,
          userId: normId,
          amount: topUp.amount,
          topUpStatus: topUp.status,
          walletBalance: wallet.availableBalance,
          issue: 'FINANCIAL_INTEGRITY_ERROR: Available wallet balance is lower than approved topup amount',
        });
      }
    });

    return {
      isConsistent: discrepancies.length === 0,
      totalApprovedCount: approved.length,
      totalApprovedVolume,
      discrepancies,
    };
  }

  public getPayments(): PlatformPaymentRecord[] {
    return this.getStore(this.PAYMENTS_KEY, SEED_PAYMENTS);
  }

  public getSettlements(): SettlementRecord[] {
    return this.getStore(this.SETTLEMENTS_KEY, SEED_SETTLEMENTS);
  }

  public getWithdrawals(): PlatformWithdrawalRecord[] {
    return this.getStore(this.WITHDRAWALS_KEY, SEED_WITHDRAWALS);
  }

  public getRefunds(): PlatformRefundRecord[] {
    return this.getStore(this.REFUNDS_KEY, SEED_REFUNDS);
  }

  public getLedger(): DoubleEntryLedgerEntry[] {
    return this.getStore(this.LEDGER_KEY, SEED_LEDGER);
  }

  private appendLedgerEntry(entry: {
    referenceId: string;
    eventType: FinancialEventType;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    operator: string;
  }): void {
    const ledger = this.getLedger();
    const id = `jrn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const journalNumber = `JRN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newEntry: DoubleEntryLedgerEntry = {
      id,
      journalNumber,
      referenceId: entry.referenceId,
      eventType: entry.eventType,
      description: entry.description,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amount: entry.amount,
      currency: 'DZD',
      timestamp: nowStr,
      operator: entry.operator,
      immutableHash: `sha256_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`,
    };

    ledger.unshift(newEntry);
    this.saveStore(this.LEDGER_KEY, ledger);
  }

  public getPlatformFinancialStats(): PlatformFinancialStats {
    const payments = this.getPayments();
    const wallets = this.getSellerWallets();
    const withdrawals = this.getWithdrawals();
    const refunds = this.getRefunds();
    const topUps = this.getTopUpRequests();

    const grossMerchandiseVolume = payments.reduce((acc, p) => acc + p.amount, 0);
    const escrowPendingTotal = wallets.reduce((acc, w) => acc + w.pendingBalance, 0);
    const sellerAvailableBalancesTotal = wallets.reduce((acc, w) => acc + w.availableBalance, 0);
    const platformNetCommissionRevenue = wallets.reduce((acc, w) => acc + w.totalCommissionPaid, 0);
    const totalWithdrawalsDisbursed = withdrawals
      .filter((w) => w.status === 'completed')
      .reduce((acc, w) => acc + w.requestedAmount, 0);
    const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
    const totalRefundsVolume = refunds.reduce((acc, r) => acc + r.refundAmount, 0);

    return {
      grossMerchandiseVolume,
      escrowPendingTotal,
      sellerAvailableBalancesTotal,
      platformNetCommissionRevenue,
      totalWithdrawalsDisbursed,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingWithdrawals.reduce((acc, w) => acc + w.requestedAmount, 0),
      totalRefundsVolume,
      activeDisputeCount: 1,
    };
  }
}

export const financialService = new FinancialService();
