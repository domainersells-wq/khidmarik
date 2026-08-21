export interface EscrowStoreRecord {
  id: string;
  orderId: string;
  orderType: string;
  payerId: string;
  payeeId: string;
  totalAmountDA: number;
  platformFeeDA: number;
  payeeNetDA: number;
  sparePartsAmountDA: number;
  status: 'HELD' | 'DELIVERED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'PARTIALLY_RELEASED';
  protectionDurationHours: number;
  heldAt: string;
  deliveredAt?: string;
  protectionEndsAt?: string;
  releasedAt?: string;
  disputeReason?: string;
  disputeEvidenceUrls?: string[];
  resolutionType?: string;
  vendorPayoutDA?: number;
  buyerRefundDA?: number;
  adminNotes?: string;
}

// Global in-memory escrow database singleton
export const globalEscrowStore: Record<string, EscrowStoreRecord> = {
  'SOS-2026-8941': {
    id: 'ESC-2026-001',
    orderId: 'SOS-2026-8941',
    orderType: 'service',
    payerId: 'cust_0192',
    payeeId: 'craft_8820',
    totalAmountDA: 6800,
    platformFeeDA: 340,
    payeeNetDA: 6460,
    sparePartsAmountDA: 1800,
    status: 'HELD',
    protectionDurationHours: 48,
    heldAt: new Date().toISOString()
  },
  'ORD-DZ-8941': {
    id: 'ESC-2026-002',
    orderId: 'ORD-DZ-8941',
    orderType: 'ecommerce',
    payerId: 'cust_0192',
    payeeId: 'store_tech_alger',
    totalAmountDA: 4700,
    platformFeeDA: 235,
    payeeNetDA: 4465,
    sparePartsAmountDA: 0,
    status: 'DELIVERED',
    protectionDurationHours: 120, // 5 days
    heldAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    deliveredAt: new Date().toISOString(),
    protectionEndsAt: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString()
  }
};
