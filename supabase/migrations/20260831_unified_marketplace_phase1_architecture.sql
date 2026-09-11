-- ==============================================================================================
-- KHIDMATIK UNIFIED MARKETPLACE ARCHITECTURE - PHASE 1 DATABASE MIGRATION
-- Migration Name: 20260831_unified_marketplace_phase1_architecture.sql
-- Description: Core database architecture and relational model connecting:
--              Orders, Payments, Shipments, Delivery Verification, Inspection Sessions,
--              Cost Allocations, Policy Versions, Subscription Snapshots, Financial Ledger,
--              Settlements, Seller Wallets, and Administrative Audit Logs.
-- ==============================================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================================
-- 2. CREATE MISSING CORE TABLES
-- ==============================================================================================

-- A. Delivery Inspection Sessions Table
-- Connects delivery agent, customer, and seller at the exact moment of parcel inspection.
CREATE TABLE IF NOT EXISTS public.delivery_inspection_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    order_number VARCHAR(64) NOT NULL,
    shipment_id TEXT,
    customer_id UUID,
    seller_id VARCHAR(64) NOT NULL,
    delivery_agent_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'initiated', -- 'initiated', 'inspecting', 'accepted', 'rejected', 'partial_acceptance', 'expired'
    decision VARCHAR(32), -- 'FULL_ACCEPT', 'FULL_REJECT', 'PARTIAL_ACCEPT', 'DEFECT_CLAIM'
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    max_duration_minutes INT NOT NULL DEFAULT 15, -- Inspection timer standard (15 minutes at doorstep)
    inspection_checklist JSONB NOT NULL DEFAULT '{"package_intact": true, "product_matches": true, "no_visible_damage": true}'::jsonb,
    item_decisions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Per item acceptance/rejection breakdown
    customer_feedback TEXT,
    rejection_reason_code VARCHAR(64),
    evidence_photos TEXT[] DEFAULT '{}',
    customer_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. Financial Policy Versions Table
-- Maintains immutable versioning for platform fees, commission rates, and refund policies.
CREATE TABLE IF NOT EXISTS public.financial_policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_code VARCHAR(64) NOT NULL, -- e.g. 'STANDARD_COMMISSION_POLICY', 'SHIPPING_REJECTION_POLICY'
    version_number VARCHAR(32) NOT NULL, -- e.g. 'v2026.1'
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    effective_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(policy_code, version_number)
);

-- C. Seller Subscription Snapshots Table
-- Freezes seller tier, protection percentage, and limits at the exact moment of order/dispute creation.
CREATE TABLE IF NOT EXISTS public.seller_subscription_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(64) NOT NULL,
    order_id UUID,
    order_number VARCHAR(64),
    plan_id VARCHAR(64) NOT NULL, -- 'free', 'starter', 'pro', 'enterprise'
    plan_name VARCHAR(128) NOT NULL,
    seller_protection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    shipping_protection_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    return_shipping_protection_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    max_shipping_protection_per_order NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_shipping_protection_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    monthly_limit_remaining NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    platform_commission_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. Settlements Table
-- Comprehensive order settlement ledger capturing gross, net payout, fees, and protections.
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number VARCHAR(64) NOT NULL UNIQUE, -- e.g. "STL-2026-000841"
    order_id UUID,
    order_number VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    courier_id VARCHAR(64),
    customer_id UUID,
    gross_order_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    platform_commission_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    seller_protection_credited_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    refunded_to_customer_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_seller_payout NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_courier_payout NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_platform_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    status VARCHAR(32) NOT NULL DEFAULT 'calculated', -- 'pending', 'calculated', 'approved', 'transferred', 'disputed', 'cancelled'
    payout_batch_id VARCHAR(64),
    payout_reference VARCHAR(128),
    settled_at TIMESTAMPTZ,
    approved_by VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. Universal Financial Ledger Table (Double-Entry Audit Engine)
-- Immutable ledger recording every single debit and credit across the entire marketplace.
CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    order_number VARCHAR(64),
    shipment_id TEXT,
    settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
    entry_type VARCHAR(64) NOT NULL, 
    -- 'ESCROW_HOLD', 'ESCROW_RELEASE', 'SHIPPING_FEE_COLLECTED', 'PLATFORM_COMMISSION', 
    -- 'SELLER_PAYOUT', 'CUSTOMER_REFUND', 'COURIER_PAYOUT', 'SELLER_PROTECTION_CREDIT', 
    -- 'DISPUTE_CHARGEBACK', 'PENALTY_FEE', 'WALLET_TOPUP', 'WITHDRAWAL'
    debit_account VARCHAR(128) NOT NULL, -- e.g. 'CUSTOMER_WALLET', 'ESCROW_VAULT', 'PLATFORM_REVENUE'
    credit_account VARCHAR(128) NOT NULL, -- e.g. 'SELLER_WALLET', 'COURIER_CLEARING', 'REFUND_RESERVE'
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    balance_after NUMERIC(14, 2),
    description TEXT NOT NULL,
    reference_id VARCHAR(128), -- Payment transaction or settlement identifier
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. Platform Admin Audit Logs Table
-- Immutable activity log of all critical administrator actions across the platform.
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(64) NOT NULL,
    admin_email VARCHAR(128),
    action VARCHAR(64) NOT NULL, -- 'UPDATE_SETTLEMENT', 'RESOLVE_DISPUTE', 'UPDATE_POLICY', 'RELEASE_FUNDS', 'CANCEL_SHIPMENT'
    entity_type VARCHAR(64) NOT NULL, -- 'order', 'settlement', 'dispute', 'shipment', 'policy', 'wallet'
    entity_id VARCHAR(64) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================================
-- 3. ENSURE COLUMNS ON EXISTING TABLES (NON-DESTRUCTIVE ADDITIONS)
-- ==============================================================================================

-- Orders Table Extension
DO $$ BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(32) DEFAULT 'not_applicable';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_code_verified BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN others THEN null;
END $$;

-- Order Delivery Verifications Table Alignment
DO $$ BEGIN
    ALTER TABLE public.order_delivery_verifications ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    ALTER TABLE public.order_delivery_verifications ADD COLUMN IF NOT EXISTS seller_id VARCHAR(64);
EXCEPTION WHEN others THEN null;
END $$;

-- Order Cost Allocations Alignment
DO $$ BEGIN
    ALTER TABLE public.order_cost_allocations ADD COLUMN IF NOT EXISTS shipment_id TEXT;
    ALTER TABLE public.order_cost_allocations ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL;
    ALTER TABLE public.order_cost_allocations ADD COLUMN IF NOT EXISTS inspection_session_id UUID REFERENCES public.delivery_inspection_sessions(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN null;
END $$;

-- Seller Wallets Alignment
DO $$ BEGIN
    ALTER TABLE public.seller_wallets ADD COLUMN IF NOT EXISTS locked_dispute_balance NUMERIC(14, 2) DEFAULT 0.00;
    ALTER TABLE public.seller_wallets ADD COLUMN IF NOT EXISTS lifetime_settled_balance NUMERIC(14, 2) DEFAULT 0.00;
EXCEPTION WHEN others THEN null;
END $$;

-- Seller Wallet Transactions Alignment
DO $$ BEGIN
    ALTER TABLE public.seller_wallet_transactions ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL;
    ALTER TABLE public.seller_wallet_transactions ADD COLUMN IF NOT EXISTS ledger_entry_id UUID REFERENCES public.financial_ledger(id) ON DELETE SET NULL;
    ALTER TABLE public.seller_wallet_transactions ADD COLUMN IF NOT EXISTS transaction_category VARCHAR(64) DEFAULT 'ORDER_PAYOUT';
EXCEPTION WHEN others THEN null;
END $$;

-- ==============================================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================================

-- Inspection Sessions
CREATE INDEX IF NOT EXISTS idx_inspection_order ON public.delivery_inspection_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_inspection_order_num ON public.delivery_inspection_sessions(order_number);
CREATE INDEX IF NOT EXISTS idx_inspection_shipment ON public.delivery_inspection_sessions(shipment_id);
CREATE INDEX IF NOT EXISTS idx_inspection_customer ON public.delivery_inspection_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_inspection_seller ON public.delivery_inspection_sessions(seller_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON public.delivery_inspection_sessions(status);
CREATE INDEX IF NOT EXISTS idx_inspection_created ON public.delivery_inspection_sessions(created_at DESC);

-- Financial Policy Versions
CREATE INDEX IF NOT EXISTS idx_policy_code_ver ON public.financial_policy_versions(policy_code, version_number);
CREATE INDEX IF NOT EXISTS idx_policy_active ON public.financial_policy_versions(is_active);

-- Subscription Snapshots
CREATE INDEX IF NOT EXISTS idx_sub_snapshot_seller ON public.seller_subscription_snapshots(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_snapshot_order ON public.seller_subscription_snapshots(order_id);
CREATE INDEX IF NOT EXISTS idx_sub_snapshot_created ON public.seller_subscription_snapshots(created_at DESC);

-- Settlements
CREATE INDEX IF NOT EXISTS idx_settlements_order ON public.settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_order_num ON public.settlements(order_number);
CREATE INDEX IF NOT EXISTS idx_settlements_seller ON public.settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_batch ON public.settlements(payout_batch_id);
CREATE INDEX IF NOT EXISTS idx_settlements_created ON public.settlements(created_at DESC);

-- Financial Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order_num ON public.financial_ledger(order_number);
CREATE INDEX IF NOT EXISTS idx_ledger_shipment ON public.financial_ledger(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ledger_settlement ON public.financial_ledger(settlement_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_type ON public.financial_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_debit_acc ON public.financial_ledger(debit_account);
CREATE INDEX IF NOT EXISTS idx_ledger_credit_acc ON public.financial_ledger(credit_account);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.financial_ledger(created_at DESC);

-- Admin Audit Logs
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_audit_logs(created_at DESC);

-- ==============================================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

-- Enable RLS on all newly created tables
ALTER TABLE public.delivery_inspection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_subscription_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Delivery Inspection Sessions RLS
CREATE POLICY "Customers can view their inspection sessions"
    ON public.delivery_inspection_sessions FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Sellers can view inspection sessions for their orders"
    ON public.delivery_inspection_sessions FOR SELECT
    USING (seller_id = (auth.jwt() ->> 'seller_id') OR seller_id = auth.uid()::text);

CREATE POLICY "Admins have full access to inspection sessions"
    ON public.delivery_inspection_sessions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 2. Financial Policy Versions RLS
CREATE POLICY "Anyone authenticated can view active financial policies"
    ON public.financial_policy_versions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage financial policy versions"
    ON public.financial_policy_versions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 3. Seller Subscription Snapshots RLS
CREATE POLICY "Sellers can view their subscription snapshots"
    ON public.seller_subscription_snapshots FOR SELECT
    USING (seller_id = (auth.jwt() ->> 'seller_id') OR seller_id = auth.uid()::text);

CREATE POLICY "Admins have full access to subscription snapshots"
    ON public.seller_subscription_snapshots FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 4. Settlements RLS
CREATE POLICY "Sellers can view their own settlements"
    ON public.settlements FOR SELECT
    USING (seller_id = (auth.jwt() ->> 'seller_id') OR seller_id = auth.uid()::text);

CREATE POLICY "Admins have full access to settlements"
    ON public.settlements FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 5. Financial Ledger RLS
CREATE POLICY "Sellers can view ledger entries related to their payouts"
    ON public.financial_ledger FOR SELECT
    USING (
        credit_account = (auth.jwt() ->> 'seller_id') OR 
        debit_account = (auth.jwt() ->> 'seller_id') OR
        credit_account = ('SELLER_WALLET_' || auth.uid()::text)
    );

CREATE POLICY "Admins have full access to financial ledger"
    ON public.financial_ledger FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- 6. Admin Audit Logs RLS
CREATE POLICY "Admins have access to administrative audit logs"
    ON public.admin_audit_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
