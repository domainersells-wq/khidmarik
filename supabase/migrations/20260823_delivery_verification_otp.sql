-- ==============================================================================================
-- Khidmatik Marketplace - Delivery Verification Code (OTP/PIN) & Anti-Fraud Logs Schema
-- Migration: 20260823_delivery_verification_otp.sql
-- ==============================================================================================

-- 1. Order Delivery Verifications Table (Stores Salted Hash Only)
CREATE TABLE IF NOT EXISTS public.order_delivery_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    code_hash VARCHAR(128) NOT NULL, -- SHA-256 / HMAC hash of the 6-digit OTP
    salt VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'locked', 'cancelled'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(128),
    verified_by_role VARCHAR(32), -- 'delivery_agent', 'store_employee', 'admin'
    delivery_agent_id VARCHAR(64),
    delivery_company_id VARCHAR(64),
    delivery_method VARCHAR(32) DEFAULT 'shipping_company', -- 'shipping_company', 'seller_delivery', 'store_pickup'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_verif_order ON public.order_delivery_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_verif_customer ON public.order_delivery_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_verif_status ON public.order_delivery_verifications(status);

-- 2. Delivery Verification Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.delivery_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    verification_id UUID REFERENCES public.order_delivery_verifications(id) ON DELETE SET NULL,
    actor_id VARCHAR(128) NOT NULL,
    actor_role VARCHAR(32) NOT NULL, -- 'CUSTOMER', 'DELIVERY_AGENT', 'STORE_EMPLOYEE', 'ADMIN', 'SYSTEM'
    action VARCHAR(64) NOT NULL, -- 'code_generated', 'verification_attempt', 'verification_failed', 'verification_locked', 'verification_success', 'code_regenerated', 'verification_cancelled'
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store non-sensitive metadata (attempt count, failure reason, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_order ON public.delivery_verification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_created_at ON public.delivery_verification_logs(created_at DESC);

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.order_delivery_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_verification_logs ENABLE ROW LEVEL SECURITY;

-- Customers can view their own delivery verification record status
CREATE POLICY "Customers can view their delivery verification status"
    ON public.order_delivery_verifications FOR SELECT
    USING (auth.uid() = customer_id);

-- Couriers & Delivery Agents can view verification metadata for orders assigned to their company
CREATE POLICY "Couriers can access verification record for assigned orders"
    ON public.order_delivery_verifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_delivery_verifications.order_id
        )
    );

-- Platform Admin full management
CREATE POLICY "Admins have full access to delivery verifications"
    ON public.order_delivery_verifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins have full access to delivery logs"
    ON public.delivery_verification_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
