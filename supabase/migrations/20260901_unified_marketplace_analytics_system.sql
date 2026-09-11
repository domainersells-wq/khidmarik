-- ==============================================================================================
-- KHIDMATIK UNIFIED MARKETPLACE ARCHITECTURE - COMPLETE ANALYTICS & BI SYSTEM MIGRATION
-- Migration Name: 20260901_unified_marketplace_analytics_system.sql
-- Description: Analytics Events, Store Visits, Ad Tracking & Attributions, Daily Aggregates,
--              Performance Indexes, and Role-Based Security Policies.
-- ==============================================================================================

-- 1. Analytics Events Tracking Table (High-Speed Event Streaming)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(64) NOT NULL, -- 'page_view', 'store_view', 'product_view', 'service_view', 'ad_impression', 'ad_click', 'add_to_cart', 'checkout_started', 'order_completed', 'booking_completed'
    event_type VARCHAR(32) NOT NULL, -- 'TRAFFIC', 'ECOMMERCE', 'BOOKING', 'ADVERTISING', 'ENGAGEMENT'
    user_id VARCHAR(64), -- Nullable for anonymous users
    anonymous_session_id VARCHAR(128), -- Privacy-safe session fingerprint
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    product_id VARCHAR(64),
    service_id VARCHAR(64),
    provider_id VARCHAR(64),
    order_id TEXT,
    booking_id TEXT,
    ad_id VARCHAR(64),
    campaign_id VARCHAR(64),
    session_id VARCHAR(128),
    source VARCHAR(64) DEFAULT 'direct', -- 'direct', 'search', 'ad', 'social', 'email', 'external'
    referrer TEXT,
    device_type VARCHAR(32) DEFAULT 'desktop', -- 'desktop', 'mobile', 'tablet'
    country VARCHAR(64) DEFAULT 'Algeria',
    wilaya VARCHAR(64),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Store Visits Table (Aggregate Traffic & Attribution)
CREATE TABLE IF NOT EXISTS public.store_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64),
    anonymous_session_id VARCHAR(128) NOT NULL,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source VARCHAR(64) DEFAULT 'direct',
    referrer TEXT,
    device_type VARCHAR(32) DEFAULT 'desktop',
    country VARCHAR(64) DEFAULT 'Algeria',
    wilaya VARCHAR(64),
    campaign_id VARCHAR(64),
    ad_id VARCHAR(64),
    landing_page TEXT,
    session_id VARCHAR(128)
);

-- 3. Advertising Impressions, Clicks & Attributions Table
CREATE TABLE IF NOT EXISTS public.ad_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id VARCHAR(64) NOT NULL,
    campaign_id VARCHAR(64),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id VARCHAR(64),
    event_type VARCHAR(32) NOT NULL, -- 'IMPRESSION', 'CLICK', 'CONVERSION'
    viewer_id VARCHAR(64),
    anonymous_session_id VARCHAR(128),
    device_type VARCHAR(32) DEFAULT 'desktop',
    source VARCHAR(64) DEFAULT 'in_app',
    referrer TEXT,
    landing_page TEXT,
    cost_amount NUMERIC(10, 2) DEFAULT 0.00,
    attributed_order_id TEXT,
    attributed_revenue NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Daily Pre-Aggregated Tables for Ultra-Fast Historic Analytics
CREATE TABLE IF NOT EXISTS public.analytics_daily_platform (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL UNIQUE,
    total_users INT DEFAULT 0,
    active_users INT DEFAULT 0,
    new_users INT DEFAULT 0,
    total_stores INT DEFAULT 0,
    total_providers INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    total_bookings INT DEFAULT 0,
    completed_bookings INT DEFAULT 0,
    gross_revenue NUMERIC(14, 2) DEFAULT 0.00,
    platform_commission NUMERIC(14, 2) DEFAULT 0.00,
    seller_revenue NUMERIC(14, 2) DEFAULT 0.00,
    provider_revenue NUMERIC(14, 2) DEFAULT 0.00,
    refunds_total NUMERIC(12, 2) DEFAULT 0.00,
    withdrawals_total NUMERIC(12, 2) DEFAULT 0.00,
    disputes_count INT DEFAULT 0,
    store_visits INT DEFAULT 0,
    product_views INT DEFAULT 0,
    ad_impressions INT DEFAULT 0,
    ad_clicks INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    visits_count INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    product_views INT DEFAULT 0,
    add_to_cart_count INT DEFAULT 0,
    checkout_starts INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    gross_sales NUMERIC(12, 2) DEFAULT 0.00,
    net_revenue NUMERIC(12, 2) DEFAULT 0.00,
    ad_spend NUMERIC(10, 2) DEFAULT 0.00,
    ad_revenue NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(summary_date, store_id)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    provider_id VARCHAR(64) NOT NULL,
    service_views INT DEFAULT 0,
    requests_count INT DEFAULT 0,
    completed_jobs INT DEFAULT 0,
    cancelled_jobs INT DEFAULT 0,
    gross_revenue NUMERIC(12, 2) DEFAULT 0.00,
    net_revenue NUMERIC(12, 2) DEFAULT 0.00,
    average_rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(summary_date, provider_id)
);

-- 5. High-Performance PostgreSQL Indexes for Lightning-Fast Queries
CREATE INDEX IF NOT EXISTS idx_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_created ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_store_created ON public.analytics_events(store_id, created_at DESC) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_provider_created ON public.analytics_events(provider_id, created_at DESC) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_ad_created ON public.analytics_events(ad_id, created_at DESC) WHERE ad_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_visits_store_date ON public.store_visits(store_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_visits_session ON public.store_visits(anonymous_session_id);

CREATE INDEX IF NOT EXISTS idx_ad_tracking_ad_date ON public.ad_tracking_events(ad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_tracking_store_date ON public.ad_tracking_events(store_id, created_at DESC);

-- 6. Row Level Security Policies
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_platform ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_providers ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full management for analytics events"
    ON public.analytics_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full management for platform daily analytics"
    ON public.analytics_daily_platform FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Store owners access ONLY their own store analytics
CREATE POLICY "Store owners view own store daily analytics"
    ON public.analytics_daily_stores FOR SELECT
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners view own store visits"
    ON public.store_visits FOR SELECT
    USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- Providers access ONLY their own provider analytics
CREATE POLICY "Providers view own daily analytics"
    ON public.analytics_daily_providers FOR SELECT
    USING (provider_id = auth.uid()::text);
