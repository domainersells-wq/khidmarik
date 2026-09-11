-- ==============================================================================================
-- Khidmatik Marketplace - Provider Verification & KYC Management Schema
-- Migration: 20260823_provider_verification_system.sql
-- ==============================================================================================

-- 1. Provider Verification Profiles Table (6-Stage Lifecycle)
CREATE TABLE IF NOT EXISTS public.provider_verification_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    provider_name VARCHAR(128) NOT NULL,
    provider_type VARCHAR(32) NOT NULL DEFAULT 'artisan', -- 'artisan', 'store', 'freelancer', 'company'
    status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED', -- 'REGISTERED', 'PHONE_VERIFIED', 'PROFILE_COMPLETED', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'SUSPENDED'
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    phone_number VARCHAR(32),
    email VARCHAR(128),
    legal_name VARCHAR(128),
    national_id_number VARCHAR(64),
    date_of_birth DATE,
    nationality VARCHAR(64) DEFAULT 'Algerian',
    business_trade_name VARCHAR(128),
    business_structure VARCHAR(64), -- 'individual_artisan', 'registered_sole_proprietorship', 'sarl_eurl', 'other'
    trade_registry_number VARCHAR(64), -- RC Number
    tax_id_number VARCHAR(64), -- NIF / NIS Number
    artisan_card_number VARCHAR(64),
    wilaya VARCHAR(64),
    address TEXT,
    profile_photo_url TEXT,
    verified_badge_active BOOLEAN NOT NULL DEFAULT false,
    reviewer_id VARCHAR(64),
    reviewer_name VARCHAR(128),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    action_required_notes TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_prov_verif_status ON public.provider_verification_profiles(status);
CREATE INDEX IF NOT EXISTS idx_prov_verif_provider ON public.provider_verification_profiles(provider_id);

-- 2. Provider Verification Documents Table
CREATE TABLE IF NOT EXISTS public.provider_verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES public.provider_verification_profiles(id) ON DELETE CASCADE,
    provider_id VARCHAR(64) NOT NULL,
    document_category VARCHAR(64) NOT NULL, -- 'IDENTITY_NATIONAL_ID', 'IDENTITY_PASSPORT', 'TRADE_REGISTER_RC', 'TAX_CARD_NIF', 'ARTISAN_CARD', 'DIPLOMA_CERTIFICATE', 'PROFESSIONAL_LICENSE', 'PROOF_OF_ADDRESS', 'PROFILE_PHOTO'
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(64) NOT NULL DEFAULT 'application/pdf',
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_prov_docs_verif ON public.provider_verification_documents(verification_id);
CREATE INDEX IF NOT EXISTS idx_prov_docs_provider ON public.provider_verification_documents(provider_id);

-- 3. Provider Verification History & Audit Log
CREATE TABLE IF NOT EXISTS public.provider_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID NOT NULL REFERENCES public.provider_verification_profiles(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128),
    actor_role VARCHAR(32) NOT NULL, -- 'PROVIDER', 'ADMIN', 'SYSTEM'
    action VARCHAR(64) NOT NULL, -- 'PHONE_CONFIRMED', 'PROFILE_SAVED', 'DOCUMENT_UPLOADED', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'REJECTED', 'ACTION_REQUESTED', 'SUSPENDED'
    previous_status VARCHAR(32),
    new_status VARCHAR(32) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_prov_hist_verif ON public.provider_verification_history(verification_id);

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.provider_verification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verification_history ENABLE ROW LEVEL SECURITY;

-- Providers can view and update their own profile and documents
CREATE POLICY "Providers can view own verification profile"
    ON public.provider_verification_profiles FOR SELECT
    USING (auth.uid() = user_id OR provider_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Providers can view own documents"
    ON public.provider_verification_documents FOR SELECT
    USING (provider_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

-- Admins full access
CREATE POLICY "Admins full access to provider verification"
    ON public.provider_verification_profiles FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access to provider documents"
    ON public.provider_verification_documents FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access to verification history"
    ON public.provider_verification_history FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
