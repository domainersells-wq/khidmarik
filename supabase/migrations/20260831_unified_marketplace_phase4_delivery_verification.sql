-- ==============================================================================================
-- KHIDMATIK UNIFIED MARKETPLACE ARCHITECTURE - PHASE 4 DELIVERY CONFIRMATION CODE MIGRATION
-- Migration Name: 20260831_unified_marketplace_phase4_delivery_verification.sql
-- Description: Private Customer Delivery Confirmation Code (OTP), Cryptographic Salt/Hash,
--              Anti-Brute Force Protection, Delivery Agent Verification, and Audit Logging.
-- ==============================================================================================

-- 1. Ensure Table Structure for Order Delivery Verifications
CREATE TABLE IF NOT EXISTS public.order_delivery_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    order_number VARCHAR(64),
    shipment_id TEXT,
    tracking_number VARCHAR(100),
    customer_id VARCHAR(64) NOT NULL,
    code_hash VARCHAR(128) NOT NULL, -- SHA-256 HMAC of 6-digit confirmation code with random salt
    salt VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'available', 'verified', 'expired', 'locked', 'cancelled'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(128),
    verified_by_role VARCHAR(32), -- 'delivery_agent', 'store_employee', 'admin', 'system'
    delivery_agent_id VARCHAR(64),
    delivery_company_id VARCHAR(64),
    delivery_method VARCHAR(32) DEFAULT 'shipping_company', -- 'shipping_company', 'seller_delivery', 'store_pickup'
    regenerated_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_verif_order_id ON public.order_delivery_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_verif_tracking ON public.order_delivery_verifications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_verif_customer ON public.order_delivery_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_verif_status ON public.order_delivery_verifications(status);

-- 3. Delivery Verification Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.delivery_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    order_number VARCHAR(64),
    shipment_id TEXT,
    tracking_number VARCHAR(100),
    verification_id UUID REFERENCES public.order_delivery_verifications(id) ON DELETE SET NULL,
    actor_id VARCHAR(128) NOT NULL,
    actor_role VARCHAR(32) NOT NULL, -- 'CUSTOMER', 'DELIVERY_AGENT', 'STORE_EMPLOYEE', 'ADMIN', 'SYSTEM'
    action VARCHAR(64) NOT NULL, -- 'code_generated', 'code_viewed', 'verification_attempt', 'verification_failed', 'verification_locked', 'verification_success', 'code_regenerated', 'verification_cancelled'
    attempt_number INT DEFAULT 1,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vlogs_order ON public.delivery_verification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_vlogs_tracking ON public.delivery_verification_logs(tracking_number);
CREATE INDEX IF NOT EXISTS idx_vlogs_created ON public.delivery_verification_logs(created_at DESC);

-- 4. Anti-Brute-Force Rate Limiting Registry
CREATE TABLE IF NOT EXISTS public.delivery_verification_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier_key VARCHAR(128) NOT NULL, -- e.g. "IP_192.168.1.1" or "AGENT_drv_01" or "ORD_KHM_001"
    scope VARCHAR(32) NOT NULL, -- 'IP', 'AGENT', 'ORDER'
    failed_attempts INT NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_key ON public.delivery_verification_rate_limits(identifier_key, scope);

-- 5. Row Level Security Policies
ALTER TABLE public.order_delivery_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_verification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Customers can view their own verification record status (never plaintext code)
CREATE POLICY "Customers view own delivery verification status"
    ON public.order_delivery_verifications FOR SELECT
    USING (customer_id = auth.uid()::text OR customer_id = (auth.jwt() ->> 'customer_id'));

-- Delivery Agents can view metadata for assigned shipments
CREATE POLICY "Couriers view assigned verification metadata"
    ON public.order_delivery_verifications FOR SELECT
    USING (delivery_agent_id = (auth.jwt() ->> 'agent_id') OR auth.jwt() ->> 'role' = 'courier');

-- Admin full access
CREATE POLICY "Admins full management for delivery verifications"
    ON public.order_delivery_verifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access to delivery verification logs"
    ON public.delivery_verification_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
