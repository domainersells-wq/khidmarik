/**
 * Complete Platform Financial System Models & Double-Entry Ledger Types
 * Khidmatik Super-App Platform
 */

export type CurrencyCode = 'DZD';

export type PaymentGatewayMethod =
  | 'edahabia'
  | 'baridimob'
  | 'cib'
  | 'cash_on_delivery'
  | 'stripe'
  | 'wallet';

export type PaymentStatus =
  | 'succeeded'
  | 'processing'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type SettlementStatus =
  | 'PENDING_ESCROW'
  | 'SETTLED'
  | 'REVERSED'
  | 'HELD_IN_DISPUTE';

export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'completed';

export type FinancialEventType =
  | 'CUSTOMER_PAYMENT'
  | 'COMMISSION_EARNED'
  | 'ESCROW_HOLD'
  | 'SETTLEMENT_RELEASE'
  | 'REFUND_FULL'
  | 'REFUND_PARTIAL'
  | 'WITHDRAWAL_REQUEST'
  | 'WITHDRAWAL_PAYOUT'
  | 'WITHDRAWAL_REVERSAL'
  | 'ADJUSTMENT';

export interface PlatformPaymentRecord {
  id: string;
  paymentReference: string;
  orderId: string;
  orderSource: 'store' | 'marketplace' | 'craftsman' | 'banquet_hall' | 'subscription';
  payerId: string;
  payerName: string;
  payerPhone: string;
  amount: number; // in DZD (DA)
  currency: CurrencyCode;
  method: PaymentGatewayMethod;
  gatewayTransactionId: string;
  idempotencyKey: string;
  networkFee: number; // SATIM / BaridiMob gateway processing fee
  netAmount: number; // amount - networkFee
  status: PaymentStatus;
  createdAt: string;
  ipAddress?: string;
  receiptUrl?: string;
}

export interface PlatformCommissionRecord {
  id: string;
  categoryName: string;
  entityType: 'store' | 'craftsman' | 'banquet_hall' | 'marketplace_seller';
  defaultRatePercent: number; // e.g., 8% for store, 10% for craftsman
  minFeeDZD: number;
  maxFeeDZD?: number;
  totalCollectedThisMonth: number;
  totalVolumeProcessed: number;
  isActive: boolean;
  lastUpdated: string;
}

export interface SellerWalletBalance {
  sellerId: string;
  sellerName: string;
  entityType: 'store' | 'provider' | 'venue' | 'marketplace_seller';
  email: string;
  phone: string;
  wilaya: string;
  pendingBalance: number; // Escrow locked in-flight
  availableBalance: number; // Cleared & ready for withdrawal
  lifetimeGross: number; // All-time GMV
  totalCommissionPaid: number;
  totalWithdrawn: number; // Successfully paid out
  currency: CurrencyCode;
  defaultPayoutMethod: 'Algérie Poste (CCP)' | 'BaridiMob' | 'BNA' | 'BEA' | 'CPA' | 'BDL';
  defaultAccountNumber: string;
  defaultRipNumber: string;
  lastSettlementAt?: string;
}

export interface SettlementRecord {
  id: string;
  orderId: string;
  sellerId: string;
  grossAmount: number;
  platformCommission: number;
  netSettledAmount: number;
  currency: CurrencyCode;
  status: SettlementStatus;
  protectionHours: number; // e.g., 48 hours protection window
  heldAt: string;
  protectionEndsAt: string;
  settledAt?: string;
  operator?: string;
  notes?: string;
}

export interface PlatformRefundRecord {
  id: string;
  refundCode: string;
  orderId: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  sellerOrProviderName: string;
  originalAmount: number;
  refundAmount: number;
  isPartial: boolean;
  currency: CurrencyCode;
  reason:
    | 'product_defect'
    | 'not_as_described'
    | 'late_delivery'
    | 'service_not_delivered'
    | 'duplicate_charge'
    | 'customer_cancellation'
    | 'dispute_arbitration'
    | 'other';
  status: 'completed' | 'processing' | 'rejected';
  reversalTransactionId?: string;
  createdAt: string;
  processedBy: string;
  adminNotes?: string;
}

export interface PlatformWithdrawalRecord {
  id: string;
  payoutCode: string; // e.g. "WD-2026-9012"
  recipientId: string;
  recipientName: string;
  recipientType: 'store_owner' | 'service_provider';
  bankOrCCP: 'Algérie Poste (CCP)' | 'BaridiMob' | 'BNA' | 'BEA' | 'CPA' | 'BDL';
  accountNumber: string;
  ripNumber: string; // 20-digit Algerian RIP
  requestedAmount: number;
  processingFee: number; // e.g. 50 DA for CCP postal stamp / bank fee
  netPayoutAmount: number; // requestedAmount - processingFee
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  processedByAdmin?: string;
  rejectionReason?: string;
  transferProofReference?: string;
  transferProofUrl?: string;
}

export interface DoubleEntryLedgerEntry {
  id: string;
  journalNumber: string; // e.g. "JRN-89401"
  referenceId: string; // orderId, withdrawalId, refundId
  eventType: FinancialEventType;
  description: string;
  debitAccount: string; // e.g. "VAULT_EDAHABIA", "ESCROW_LIABILITY", "SELLER_AVAILABLE_WALLET"
  creditAccount: string; // e.g. "PLATFORM_REVENUE_COMMISSION", "SELLER_AVAILABLE_WALLET", "CUSTOMER_ACCOUNT"
  amount: number;
  currency: CurrencyCode;
  timestamp: string;
  operator: string;
  immutableHash: string;
}

export interface PlatformFinancialStats {
  grossMerchandiseVolume: number; // Total volume processed across all channels
  escrowPendingTotal: number; // Total held in escrow
  sellerAvailableBalancesTotal: number; // Total cleared seller balances waiting withdrawal
  platformNetCommissionRevenue: number; // Total platform take-rate revenue
  totalWithdrawalsDisbursed: number; // Total paid out to sellers
  pendingWithdrawalsCount: number; // Requests needing approval
  pendingWithdrawalsAmount: number;
  totalRefundsVolume: number; // Total refunded to customers
  activeDisputeCount: number;
}

// ------------------------------------------------------------------------------------------------
// TOP-UP LIFECYCLE, WALLET LEDGER & VERIFICATION DESK TYPES
// ------------------------------------------------------------------------------------------------

export type TopUpStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT_CONFIRMATION'
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW' // Synonymous with PENDING_VERIFICATION for backward compatibility
  | 'VERIFYING'
  | 'APPROVED'
  | 'CREDITED'
  | 'REJECTED'
  | 'INFO_REQUIRED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TopUpMethod =
  | 'ccp'
  | 'algerie_poste'
  | 'baridimob'
  | 'bank'
  | 'bank_transfer'
  | 'edahabia'
  | 'cib';

export type TopUpRejectionReason =
  | 'INVALID_TRANSACTION_CODE'
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_TRANSACTION'
  | 'INVALID_RECEIPT'
  | 'TRANSFER_NOT_FOUND'
  | 'UNREADABLE_RECEIPT'
  | 'SUSPECTED_FRAUD'
  | 'OTHER';

export type VerificationMode = 'manual' | 'automatic' | 'hybrid';

export interface WalletLedgerEntry {
  id: string;
  walletId: string;
  userId: string;
  topUpRequestId?: string;
  referenceId: string;
  amount: number;
  currency: CurrencyCode;
  type: 'TOPUP_CREDIT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'WITHDRAWAL_DEBIT' | 'REFUND_CREDIT' | 'FEE_DEBIT';
  status: 'COMPLETED' | 'PENDING' | 'REVERSED';
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string;
  operator: string;
  createdAt: string;
  notes?: string;
}

export interface TopUpRequest {
  id: string;
  publicRequestNumber: string; // e.g. "TOP-2026-000004" (System Top-Up Request Number)
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  accountType?: 'client' | 'store_owner' | 'service_provider';
  walletId: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: TopUpMethod;
  status: TopUpStatus;
  verificationMode?: VerificationMode;
  idempotencyKey?: string;
  
  // Timestamps
  createdAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  updatedAt?: string;
  expiresAt: string;
  
  // Platform destination account info
  platformAccountName: string; // "KHIDMATIK / منصة خدماتك"
  platformCcpNumber: string; // "0022334455 88"
  platformRipNumber: string; // "00799999002233445588"
  
  // External Payment / Postal Reference (Separated from publicRequestNumber)
  postalTransactionCode?: string; // e.g. "98412034" or "BM-20260825-9921"
  paymentReference?: string; // Synonymous standard field
  providerTransactionId?: string; // e.g. SATIM_TX_991823 or BARIDI_BM_19283
  senderName?: string;
  senderAccount?: string;
  transferDate?: string;
  receiptUrl?: string;
  userNotes?: string;
  
  // Admin & Financial Ledger Audit
  reviewedBy?: string; // Admin Name / "Smart Auto-Verification Gateway"
  reviewedAt?: string;
  rejectionReason?: TopUpRejectionReason;
  adminNotes?: string;
  requestedInfoNote?: string;
  requestedInfoAt?: string;
  userClarificationText?: string;
  userClarificationAttachmentUrl?: string;
  userClarificationFileName?: string;
  userClarificationSubmittedAt?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

