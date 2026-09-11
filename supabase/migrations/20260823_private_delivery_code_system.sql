-- ==============================================================================================
-- Khidmatik Marketplace - Private Delivery Confirmation Code, Inspection Session & Platform Settings
-- Migration: 20260823_private_delivery_code_system.sql
-- ==============================================================================================

-- 1. Platform Delivery Settings Table (Configurable by Admin)
CREATE TABLE IF NOT EXISTS public.platform_delivery_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
    delivery_confirmation_enabled BOOLEAN NOT NULL DEFAULT true,
    delivery_code_length INTEGER NOT NULL DEFAULT 6,
    delivery_code_expiration_days INTEGER NOT NULL DEFAULT 15,
    max_delivery_code_attempts INTEGER NOT NULL DEFAULT 5,
    delivery_inspection_minutes INTEGER NOT NULL DEFAULT 10,
    require_customer_inspection BOOLEAN NOT NULL DEFAULT true,
    allow_code_regeneration BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default settings row if not exists
INSERT INTO public.platform_delivery_settings (
    id, delivery_confirmation_enabled, delivery_code_length, delivery_code_expiration_days,
    max_delivery_code_attempts, delivery_inspection_minutes, require_customer_inspection, allow_code_regeneration
) VALUES (
    'default', true, 6, 15, 5, 10, true, true
) ON CONFLICT (id) DO NOTHING;

-- 2. Enhance order_delivery_verifications with inspection session fields if not already present
ALTER TABLE public.order_delivery_verifications 
    ADD COLUMN IF NOT EXISTS inspection_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS inspection_duration_minutes INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(32) DEFAULT 'not_started'; -- 'not_started', 'inspecting', 'accepted', 'rejected'

-- 3. Enhance delivery_verification_logs with attempt numbers and success flags
ALTER TABLE public.delivery_verification_logs
    ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false;

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.platform_delivery_settings ENABLE ROW LEVEL SECURITY;

-- Public/Authenticated read for platform delivery settings
CREATE POLICY "Public read for platform delivery settings"
    ON public.platform_delivery_settings FOR SELECT USING (true);

-- Only Admins can modify platform delivery settings
CREATE POLICY "Admins can update platform delivery settings"
    ON public.platform_delivery_settings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
