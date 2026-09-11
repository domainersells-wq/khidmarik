-- ==============================================================================================
-- Khidmatik Marketplace - Escrow & Dispute Resolution System Schema
-- Migration: 20260823_escrow_dispute_system.sql
-- ==============================================================================================

-- 1. Platform Escrow Records Table
CREATE TABLE IF NOT EXISTS public.platform_escrow_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number VARCHAR(64) NOT NULL,
    payer_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id VARCHAR(64) NOT NULL,
    escrow_amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    status VARCHAR(32) NOT NULL DEFAULT 'HELD', -- 'HELD', 'PROCESSING', 'DELIVERED', 'CONFIRMED', 'RELEASED', 'DISPUTED', 'REFUNDED'
    protection_expires_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    released_by VARCHAR(64),
    release_type VARCHAR(32), -- 'automatic', 'customer_confirmed', 'early_release', 'admin_mediated'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_escrow_order ON public.platform_escrow_records(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_provider ON public.platform_escrow_records(provider_id);

-- 2. Platform Disputes Table (Standardized 8-State FSM)
CREATE TABLE IF NOT EXISTS public.platform_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_number VARCHAR(32) NOT NULL UNIQUE, -- e.g. "DSP-2026-000412"
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number VARCHAR(64) NOT NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id VARCHAR(64) NOT NULL,
    reason_code VARCHAR(64) NOT NULL, -- 'NOT_DELIVERED', 'DAMAGED_ITEMS', 'WRONG_ITEMS', 'POOR_QUALITY', 'UNAUTHORIZED_CHARGE', 'OTHER'
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_REVIEW', 'WAITING_CUSTOMER', 'WAITING_PROVIDER', 'RESOLVED', 'REFUNDED', 'RELEASED', 'CLOSED'
    disputed_amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    customer_claim_description TEXT NOT NULL,
    provider_response_text TEXT,
    provider_proposed_refund_amount NUMERIC(14, 2) DEFAULT 0.00,
    assigned_mediator_id VARCHAR(64),
    mediator_notes TEXT,
    resolution_action VARCHAR(32), -- 'FULL_REFUND_CUSTOMER', 'PARTIAL_REFUND_SPLIT', 'RELEASE_TO_PROVIDER'
    customer_refund_amount NUMERIC(14, 2) DEFAULT 0.00,
    provider_payout_amount NUMERIC(14, 2) DEFAULT 0.00,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.platform_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.platform_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON public.platform_disputes(customer_id);

-- 3. Dispute Evidence Table
CREATE TABLE IF NOT EXISTS public.dispute_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.platform_disputes(id) ON DELETE CASCADE,
    uploader_id VARCHAR(64) NOT NULL,
    uploader_role VARCHAR(32) NOT NULL, -- 'CUSTOMER', 'PROVIDER', 'ADMIN'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON public.dispute_evidence(dispute_id);

-- 4. Dispute Timeline Activity Events Table
CREATE TABLE IF NOT EXISTS public.dispute_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.platform_disputes(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_timeline_dispute ON public.dispute_timeline_events(dispute_id);

-- 5. Escrow & Dispute Financial Audit Logs Table
CREATE TABLE IF NOT EXISTS public.escrow_dispute_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    dispute_id UUID,
    action VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    debit_account VARCHAR(64),
    credit_account VARCHAR(64),
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.platform_escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_dispute_audit_logs ENABLE ROW LEVEL SECURITY;

-- Customers can view their own disputes & escrow records
CREATE POLICY "Customers can view own disputes"
    ON public.platform_disputes FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can view own escrow"
    ON public.platform_escrow_records FOR SELECT USING (auth.uid() = payer_id);

-- Providers can view disputes & escrow for their store
CREATE POLICY "Providers can view own disputes"
    ON public.platform_disputes FOR SELECT USING (provider_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Providers can view own escrow"
    ON public.platform_escrow_records FOR SELECT USING (provider_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

-- Admins full access
CREATE POLICY "Admins full access to escrow and disputes"
    ON public.platform_disputes FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
