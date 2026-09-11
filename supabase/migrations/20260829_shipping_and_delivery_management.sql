-- ==============================================================================
-- KHIDMATIK MULTI-CARRIER SHIPPING & DELIVERY MANAGEMENT SYSTEM
-- Multi-Provider Logistics, Wilaya Rates, Shipments & Real-Time Tracking
-- Migration: 20260829_shipping_and_delivery_management.sql
-- ==============================================================================

-- 1. SHIPPING PROVIDERS (CARRIER REGISTRY)
CREATE TABLE IF NOT EXISTS public.shipping_providers (
    id VARCHAR(64) PRIMARY KEY, -- 'yalidine', 'zr_express', 'maystro', 'store_fleet', 'kazitour'
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    support_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    supports_stop_desk BOOLEAN DEFAULT TRUE NOT NULL,
    supports_home_delivery BOOLEAN DEFAULT TRUE NOT NULL,
    supports_cod BOOLEAN DEFAULT TRUE NOT NULL,
    api_base_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    webhook_secret TEXT,
    default_delivery_days INT DEFAULT 2 NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Default Algerian Providers
INSERT INTO public.shipping_providers (id, name, name_ar, logo_url, website_url, support_phone, is_active, supports_stop_desk, supports_home_delivery, supports_cod, default_delivery_days)
VALUES 
('yalidine', 'Yalidine Express', 'ياليدين إكسبريس', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60', 'https://yalidine.app', '0982 40 40 40', true, true, true, true, 2),
('zr_express', 'ZR Express (ZIMOO)', 'زد آر إكسبريس', 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=100&auto=format&fit=crop&q=60', 'https://zrexpress.com', '0770 12 34 56', true, true, true, true, 2),
('maystro', 'Maystro Delivery', 'مايسترو دليفري', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=100&auto=format&fit=crop&q=60', 'https://maystro-delivery.com', '0560 90 90 90', true, true, true, true, 1),
('store_fleet', 'Khidmatik Direct / Store Fleet', 'التوصيل الخاص بالمتجر', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&auto=format&fit=crop&q=60', 'https://khidmatik.dz', '0550 00 00 00', true, false, true, true, 1)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    is_active = EXCLUDED.is_active;

-- 2. SELLER SHIPPING SETTINGS & WILAYA RATES
CREATE TABLE IF NOT EXISTS public.seller_shipping_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
    default_provider_id VARCHAR(64) REFERENCES public.shipping_providers(id) DEFAULT 'yalidine',
    enabled_providers TEXT[] DEFAULT ARRAY['yalidine', 'zr_express', 'maystro', 'store_fleet'],
    pricing_model VARCHAR(50) DEFAULT 'dynamic_wilaya' NOT NULL, -- 'flat_rate', 'dynamic_wilaya', 'zone_based'
    flat_home_rate NUMERIC(10, 2) DEFAULT 800.00 NOT NULL,
    flat_desk_rate NUMERIC(10, 2) DEFAULT 450.00 NOT NULL,
    free_shipping_threshold NUMERIC(12, 2) DEFAULT 15000.00,
    is_free_shipping_active BOOLEAN DEFAULT TRUE NOT NULL,
    default_weight_kg NUMERIC(6, 2) DEFAULT 1.00 NOT NULL,
    pickup_address TEXT,
    pickup_wilaya VARCHAR(100) DEFAULT '16 - Alger',
    pickup_commune VARCHAR(100),
    pickup_phone VARCHAR(50),
    pickup_contact_name VARCHAR(100),
    wilaya_custom_rates JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SHIPMENTS TABLE
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(64) NOT NULL,
    order_number VARCHAR(64) NOT NULL,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id),
    provider_id VARCHAR(64) NOT NULL REFERENCES public.shipping_providers(id),
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    barcode TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL, 
    -- 'DRAFT', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED'
    delivery_type VARCHAR(50) DEFAULT 'home_delivery' NOT NULL, -- 'home_delivery', 'stop_desk'
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_alt_phone VARCHAR(50),
    recipient_wilaya VARCHAR(100) NOT NULL,
    recipient_commune VARCHAR(100) NOT NULL,
    recipient_address TEXT NOT NULL,
    stop_desk_id VARCHAR(100),
    stop_desk_name VARCHAR(255),
    weight_kg NUMERIC(6, 2) DEFAULT 1.00 NOT NULL,
    package_count INT DEFAULT 1 NOT NULL,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    cod_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    is_cod BOOLEAN DEFAULT TRUE NOT NULL,
    is_free_shipping BOOLEAN DEFAULT FALSE NOT NULL,
    delivery_code VARCHAR(10), -- 6-digit OTP delivery security confirmation
    delivery_code_verified BOOLEAN DEFAULT FALSE NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(50),
    current_hub VARCHAR(100),
    failed_attempts_count INT DEFAULT 0 NOT NULL,
    failure_reason TEXT,
    manifest_number VARCHAR(100),
    waybill_url TEXT,
    estimated_delivery_date TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SHIPMENT TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS public.shipment_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    description TEXT,
    location_wilaya VARCHAR(100),
    location_commune VARCHAR(100),
    hub_name VARCHAR(100),
    actor_role VARCHAR(50) DEFAULT 'COURIER' NOT NULL, -- 'SYSTEM', 'SELLER', 'COURIER', 'CUSTOMER', 'ADMIN'
    actor_name VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for ultra-fast tracking lookups and analytics
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments (tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_store ON public.shipments (store_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_provider ON public.shipments (provider_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_timeline_tracking ON public.shipment_timeline (tracking_number, created_at DESC);
