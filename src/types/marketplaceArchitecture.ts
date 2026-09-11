/**
 * Khidmatik Unified Marketplace Architecture - Phase 1 Domain Types
 * Database schema interfaces for Orders, Payments, Shipments, Verifications,
 * Inspection Sessions, Subscriptions, Financial Ledger, and Settlements.
 */

export interface DeliveryInspectionSession {
  id: string;
  order_id?: string;
  order_number: string;
  shipment_id?: string;
  customer_id?: string;
  seller_id: string;
  delivery_agent_id?: string;
  status: 'initiated' | 'inspecting' | 'accepted' | 'rejected' | 'partial_acceptance' | 'expired';
  decision?: 'FULL_ACCEPT' | 'FULL_REJECT' | 'PARTIAL_ACCEPT' | 'DEFECT_CLAIM';
  started_at: string;
  completed_at?: string;
  max_duration_minutes: number;
  minimum_inspection_minutes?: number;
  early_acceptance_available_at?: string;
  acceptance_method?: 'normal_acceptance' | 'early_acceptance' | 'admin_override';
  private_delivery_code?: string;
  inspection_checklist: Record<string, boolean>;
  item_decisions: Array<{
    order_item_id: string;
    product_name: string;
    quantity_accepted: number;
    quantity_rejected: number;
    rejection_reason?: string;
  }>;
  customer_feedback?: string;
  rejection_reason_code?: string;
  evidence_photos?: string[];
  customer_signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialPolicyVersion {
  id: string;
  policy_code: string;
  version_number: string;
  title: string;
  title_ar: string;
  description?: string;
  rules: Record<string, any>;
  effective_from: string;
  effective_until?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface SellerSubscriptionSnapshot {
  id: string;
  seller_id: string;
  order_id?: string;
  order_number?: string;
  plan_id: string;
  plan_name: string;
  seller_protection_enabled: boolean;
  shipping_protection_percentage: number;
  return_shipping_protection_percentage: number;
  max_shipping_protection_per_order: number;
  monthly_shipping_protection_limit: number;
  monthly_limit_remaining: number;
  platform_commission_discount_pct: number;
  snapshot_data: Record<string, any>;
  created_at: string;
}

export interface Settlement {
  id: string;
  settlement_number: string;
  order_id?: string;
  order_number: string;
  seller_id: string;
  courier_id?: string;
  customer_id?: string;
  gross_order_amount: number;
  shipping_fee: number;
  platform_commission_fee: number;
  seller_protection_credited_amount: number;
  refunded_to_customer_amount: number;
  net_seller_payout: number;
  net_courier_payout: number;
  net_platform_profit: number;
  currency: string;
  status: 'pending' | 'calculated' | 'approved' | 'transferred' | 'disputed' | 'cancelled';
  payout_batch_id?: string;
  payout_reference?: string;
  settled_at?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type FinancialLedgerEntryType =
  | 'ESCROW_HOLD'
  | 'ESCROW_RELEASE'
  | 'SHIPPING_FEE_COLLECTED'
  | 'PLATFORM_COMMISSION'
  | 'SELLER_PAYOUT'
  | 'CUSTOMER_REFUND'
  | 'COURIER_PAYOUT'
  | 'SELLER_PROTECTION_CREDIT'
  | 'DISPUTE_CHARGEBACK'
  | 'PENALTY_FEE'
  | 'WALLET_TOPUP'
  | 'WITHDRAWAL';

export interface FinancialLedgerEntry {
  id: string;
  order_id?: string;
  order_number?: string;
  shipment_id?: string;
  settlement_id?: string;
  entry_type: FinancialLedgerEntryType;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  balance_after?: number;
  description: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
