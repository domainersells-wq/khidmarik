-- ==============================================================================================
-- Khidmatik Marketplace - Rejection Cost Allocation & Seller Subscription Protection Schema
-- Migration: 20260823_rejection_cost_allocation.sql
-- ==============================================================================================

-- 1. Rejection Financial Rules Table (Configurable Rules Matrix)
CREATE TABLE IF NOT EXISTS public.rejection_financial_rules (
    id VARCHAR(64) PRIMARY KEY,
    reason_code VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(32) NOT NULL, -- 'BUYER', 'SELLER', 'COURIER', 'SHARED', 'PLATFORM'
    description TEXT NOT NULL,
    default_responsibility VARCHAR(32) NOT NULL, -- 'buyer', 'seller', 'courier', 'buyer_seller_shared', etc.
    buyer_shipping_share_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    seller_shipping_share_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    platform_shipping_share_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    courier_shipping_share_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    shipping_fee_refundable BOOLEAN NOT NULL DEFAULT false,
    platform_fee_refundable BOOLEAN NOT NULL DEFAULT false,
    subscription_protection_allowed BOOLEAN NOT NULL DEFAULT true,
    requires_evidence BOOLEAN NOT NULL DEFAULT false,
    requires_manual_review BOOLEAN NOT NULL DEFAULT false,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Seller Subscription Protection Benefits Configuration Table
CREATE TABLE IF NOT EXISTS public.seller_subscription_protection_configs (
    plan_id VARCHAR(32) PRIMARY KEY, -- 'free', 'basic', 'pro', 'premium_annual'
    plan_name VARCHAR(64) NOT NULL,
    seller_protection_enabled BOOLEAN NOT NULL DEFAULT true,
    shipping_protection_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    return_shipping_protection_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    max_shipping_protection_per_order NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monthly_shipping_protection_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_protected_rejections_per_month INTEGER NOT NULL DEFAULT 0,
    platform_fee_discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    seller_fault_protection_enabled BOOLEAN NOT NULL DEFAULT false,
    shared_liability_enabled BOOLEAN NOT NULL DEFAULT true,
    fraud_protection_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Order Rejections Table
CREATE TABLE IF NOT EXISTS public.order_rejections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id VARCHAR(64) NOT NULL,
    reason_code VARCHAR(64) NOT NULL REFERENCES public.rejection_financial_rules(reason_code),
    category VARCHAR(32) NOT NULL,
    claimed_party VARCHAR(32) NOT NULL,
    final_responsibility_party VARCHAR(32) NOT NULL DEFAULT 'undetermined',
    customer_notes TEXT,
    evidence_urls TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'allocated', -- 'pending_review', 'allocated', 'disputed', 'resolved'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_order_rejections_order ON public.order_rejections(order_id);
CREATE INDEX IF NOT EXISTS idx_order_rejections_seller ON public.order_rejections(seller_id);

-- 4. Order Cost Allocations Table (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS public.order_cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rejection_id UUID NOT NULL REFERENCES public.order_rejections(id) ON DELETE CASCADE,
    responsibility_party VARCHAR(32) NOT NULL,
    product_amount NUMERIC(14, 2) NOT NULL,
    outbound_shipping_cost NUMERIC(14, 2) NOT NULL,
    return_shipping_cost NUMERIC(14, 2) NOT NULL,
    platform_shipping_fee NUMERIC(14, 2) NOT NULL,
    buyer_shipping_share NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    seller_shipping_share NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    platform_shipping_share NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    courier_shipping_share NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    seller_subscription_plan_id VARCHAR(32) NOT NULL,
    seller_protection_percentage_used NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    seller_protection_amount_used NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    customer_refund_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    seller_charge_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    platform_cost_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    courier_charge_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    explanation TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'finalized',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cost_allocations_order ON public.order_cost_allocations(order_id);

-- 5. Seller Protection Monthly Claims Ledger
CREATE TABLE IF NOT EXISTS public.seller_protection_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(64) NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    allocation_id UUID NOT NULL REFERENCES public.order_cost_allocations(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- e.g. "2026-08"
    claimed_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'approved', -- 'approved', 'under_review', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_prot_claims_seller_month ON public.seller_protection_claims(seller_id, month_year);

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.rejection_financial_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_subscription_protection_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_cost_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_protection_claims ENABLE ROW LEVEL SECURITY;

-- Public read for active financial rules and subscription tiers
CREATE POLICY "Public read for active financial rules"
    ON public.rejection_financial_rules FOR SELECT USING (true);

CREATE POLICY "Public read for subscription configs"
    ON public.seller_subscription_protection_configs FOR SELECT USING (true);

-- Customers can view their own order rejections
CREATE POLICY "Customers can view their own rejections"
    ON public.order_rejections FOR SELECT USING (auth.uid() = customer_id);

-- Sellers can view rejections and cost allocations for their stores
CREATE POLICY "Sellers can view rejections for their store"
    ON public.order_rejections FOR SELECT USING (seller_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Sellers can view cost allocations for their store"
    ON public.order_cost_allocations FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.orders WHERE orders.id = order_cost_allocations.order_id
        AND orders.seller_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
    ));

CREATE POLICY "Sellers can view their protection claims"
    ON public.seller_protection_claims FOR SELECT USING (seller_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));
