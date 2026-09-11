-- ==============================================================================================
-- KHIDMATIK ENTERPRISE SHIPPING & DELIVERY MANAGEMENT SYSTEM MIGRATION
-- Migration Name: 20260830_complete_shipping_management_system.sql
-- Description: Complete schema for multi-carrier logistics, normalized internal statuses,
--              rate rules, delivery attempts, returns, webhooks, and provider logs.
-- ==============================================================================================

-- 1. Standardized Internal Shipment Status Enum
DO $$ BEGIN
    CREATE TYPE internal_shipment_status AS ENUM (
        'pending',
        'pickup_requested',
        'picked_up',
        'in_transit',
        'arrived_at_destination',
        'out_for_delivery',
        'delivery_attempted',
        'delivered',
        'failed_delivery',
        'returned',
        'cancelled',
        'exception'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. COD Status Enum
DO $$ BEGIN
    CREATE TYPE shipment_cod_status AS ENUM (
        'pending',
        'collected',
        'not_collected',
        'refunded',
        'returned'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Shipping Providers Table
CREATE TABLE IF NOT EXISTS public.shipping_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    logo TEXT,
    country TEXT NOT NULL DEFAULT 'DZ',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    supports_api BOOLEAN NOT NULL DEFAULT FALSE,
    api_base_url TEXT,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb, -- Sensitive keys encrypted/restricted
    capabilities JSONB NOT NULL DEFAULT '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": false,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": false
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Shipping Methods Table (Home Delivery, Stop Desk, Express, Store Pickup)
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shipping Zones Table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    wilaya_codes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Shipping Pricing Rules Table
CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
    shipping_method_id TEXT REFERENCES public.shipping_methods(id) ON DELETE CASCADE,
    zone_id TEXT REFERENCES public.shipping_zones(id) ON DELETE SET NULL,
    wilaya_code TEXT, -- Specific wilaya override if applicable
    min_weight NUMERIC(10, 2) NOT NULL DEFAULT 0, -- in kg
    max_weight NUMERIC(10, 2) NOT NULL DEFAULT 999.00,
    base_fee NUMERIC(12, 2) NOT NULL DEFAULT 0, -- in DZD
    extra_kg_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    free_shipping_threshold NUMERIC(12, 2), -- order total for free shipping
    estimated_days_min INTEGER NOT NULL DEFAULT 1,
    estimated_days_max INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    customer_id TEXT,
    provider_id TEXT NOT NULL REFERENCES public.shipping_providers(id),
    shipping_method_id TEXT NOT NULL REFERENCES public.shipping_methods(id),
    tracking_number TEXT NOT NULL UNIQUE,
    provider_tracking_number TEXT,
    status internal_shipment_status NOT NULL DEFAULT 'pending',
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cod_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'DZD',
    cod_status shipment_cod_status NOT NULL DEFAULT 'pending',
    cod_collected_at TIMESTAMPTZ,
    
    -- Pickup Origin Address
    pickup_address TEXT NOT NULL,
    pickup_wilaya TEXT NOT NULL,
    pickup_commune TEXT NOT NULL,
    pickup_contact_name TEXT,
    pickup_phone TEXT,
    
    -- Delivery Destination Address
    delivery_address TEXT NOT NULL,
    delivery_wilaya TEXT NOT NULL,
    delivery_commune TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_alt_phone TEXT,
    delivery_instructions TEXT,
    
    -- Stop Desk (Pickup Agency)
    stop_desk_id TEXT,
    stop_desk_name TEXT,
    
    -- Package Profile
    weight NUMERIC(10, 2) NOT NULL DEFAULT 1.0, -- in kg
    length NUMERIC(10, 2), -- in cm
    width NUMERIC(10, 2),
    height NUMERIC(10, 2),
    package_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    
    -- Verification and Tracking
    delivery_otp_code TEXT,
    delivery_otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    label_url TEXT,
    manifest_number TEXT,
    estimated_delivery_date TIMESTAMPTZ,
    
    -- Courier/Driver Details
    driver_name TEXT,
    driver_phone TEXT,
    current_location TEXT,
    
    -- Timestamps
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Shipment Events / Timeline Table
CREATE TABLE IF NOT EXISTS public.shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status internal_shipment_status NOT NULL,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT,
    location TEXT,
    provider_status TEXT, -- Raw external carrier status string
    actor_role TEXT NOT NULL DEFAULT 'SYSTEM', -- 'SYSTEM', 'SELLER', 'COURIER', 'CUSTOMER', 'ADMIN'
    actor_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Delivery Attempts Table
CREATE TABLE IF NOT EXISTS public.shipment_delivery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'failed', -- 'failed', 'rescheduled'
    reason TEXT NOT NULL, -- e.g. 'Customer unreachable', 'Wrong address', 'Customer postponed', 'Customer refused'
    notes TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Shipment Returns Table
CREATE TABLE IF NOT EXISTS public.shipment_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    return_reason TEXT NOT NULL,
    return_tracking_number TEXT,
    status TEXT NOT NULL DEFAULT 'return_requested', -- 'return_requested', 'return_in_transit', 'returned_to_seller', 'return_completed'
    return_notes TEXT,
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Dynamic Provider Status Mappings Table
CREATE TABLE IF NOT EXISTS public.provider_status_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
    external_status TEXT NOT NULL,
    internal_status internal_shipment_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider_id, external_status)
);

-- 12. Provider API Logs Table (Redacted Audit Trail)
CREATE TABLE IF NOT EXISTS public.provider_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id TEXT NOT NULL REFERENCES public.shipping_providers(id) ON DELETE CASCADE,
    shipment_id TEXT,
    request_type TEXT NOT NULL, -- 'CREATE_SHIPMENT', 'TRACK', 'CANCEL', 'PICKUP', 'WEBHOOK'
    endpoint TEXT NOT NULL,
    request_id TEXT,
    status_code INTEGER,
    request_payload JSONB, -- Redacted sensitive info
    response_payload JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Seller Shipping Settings Table
CREATE TABLE IF NOT EXISTS public.seller_shipping_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id TEXT NOT NULL UNIQUE,
    is_shipping_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_cod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_provider_id TEXT REFERENCES public.shipping_providers(id),
    enabled_providers TEXT[] NOT NULL DEFAULT '{"manual"}'::text[],
    pricing_model TEXT NOT NULL DEFAULT 'dynamic_rules', -- 'flat', 'dynamic_rules', 'zone_based'
    flat_home_rate NUMERIC(10, 2) NOT NULL DEFAULT 600,
    flat_desk_rate NUMERIC(10, 2) NOT NULL DEFAULT 400,
    free_shipping_threshold NUMERIC(12, 2) NOT NULL DEFAULT 15000,
    is_free_shipping_active BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_address TEXT NOT NULL DEFAULT '',
    pickup_wilaya TEXT NOT NULL DEFAULT '16 - Alger',
    pickup_commune TEXT NOT NULL DEFAULT 'Bab Ezzouar',
    pickup_contact_name TEXT NOT NULL DEFAULT '',
    pickup_phone TEXT NOT NULL DEFAULT '',
    custom_wilaya_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================================
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_provider_tracking_number ON public.shipments(provider_tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_seller_id ON public.shipments(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON public.shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_provider_id ON public.shipments(provider_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment_id ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_status ON public.shipment_events(status);
CREATE INDEX IF NOT EXISTS idx_shipment_events_event_at ON public.shipment_events(event_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_shipment_id ON public.shipment_delivery_attempts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_returns_shipment_id ON public.shipment_returns(shipment_id);
CREATE INDEX IF NOT EXISTS idx_provider_logs_provider_id ON public.provider_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_logs_created_at ON public.provider_logs(created_at DESC);

-- ==============================================================================================
-- DEFAULT SEEDS (PROVIDERS, METHODS, ZONES, AND STATUS MAPPINGS)
-- ==============================================================================================

-- 1. Default Shipping Methods
INSERT INTO public.shipping_methods (id, code, name, name_ar, description, display_order)
VALUES
    ('mth_home', 'home_delivery', 'Home Delivery (Doorstep)', 'توصيل لباب المنزل (À Domicile)', 'Direct delivery to customer doorstep across 58 wilayas', 1),
    ('mth_desk', 'stop_desk', 'Pickup Point (Stop Desk)', 'استلام من المكتب (Stop Desk / Bureau)', 'Customer collects package from carrier agency in wilaya center', 2),
    ('mth_express', 'express_delivery', 'Same Day / 24H Express', 'توصيل سريع فائق (Express)', 'Urgent delivery within 24 hours in major urban centers', 3),
    ('mth_store_pickup', 'store_pickup', 'Store Pickup (Click & Collect)', 'استلام مباشر من المتجر', 'Customer collects directly from seller retail outlet or warehouse', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;

-- 2. Default Shipping Zones in Algeria
INSERT INTO public.shipping_zones (id, name, name_ar, description, wilaya_codes)
VALUES
    ('zone_north', 'North Coastal Zone', 'المنطقة الساحلية والشمالية', 'Algiers, Oran, Constantine, Annaba, Blida, Tipaza, Boumerdes, Tizi Ouzou, etc.', 
     ARRAY['16', '31', '25', '23', '09', '42', '35', '15', '06', '13', '27', '18', '21', '02']),
    ('zone_highlands', 'Highlands & Interior Zone', 'منطقة الهضاب العليا والوسط', 'Setif, Batna, Djelfa, Tiaret, Tebessa, MSila, Bordj Bou Arreridj, Medea, etc.',
     ARRAY['19', '05', '17', '14', '12', '28', '34', '26', '04', '40', '41', '43', '44', '45', '20', '22', '29']),
    ('zone_south', 'Sahara South Zone', 'منطقة الجنوب والصحراء الكبرى', 'Adrar, Tamanrasset, Ouargla, El Oued, Ghardaia, Bechar, Tindouf, Illizi, Timimoun, Djanet, etc.',
     ARRAY['01', '03', '07', '08', '11', '30', '32', '33', '37', '39', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;

-- 3. Default Shipping Providers
INSERT INTO public.shipping_providers (id, name, code, description, country, is_active, supports_api, configuration, capabilities)
VALUES
    ('manual', 'Manual Shipping Provider', 'manual', 'Standard offline logistics managed by seller/admin without third-party API', 'DZ', true, false, '{}'::jsonb, '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": false,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": false
    }'::jsonb),
    ('yalidine', 'Yalidine Express', 'yalidine', 'Algeria leading multi-wilaya courier with stop-desk and home delivery API', 'DZ', true, true, '{
        "api_base_url": "https://api.yalidine.app/v1",
        "api_key_configured": true
    }'::jsonb, '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": true,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": true
    }'::jsonb),
    ('zr_express', 'ZR Express (ZIMOO)', 'zr_express', 'Reliable national logistics covering 58 wilayas with automated tracking', 'DZ', true, true, '{
        "api_base_url": "https://api.zrexpress.com/v2",
        "api_key_configured": true
    }'::jsonb, '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": true,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": true
    }'::jsonb),
    ('maystro', 'Maystro Delivery', 'maystro', 'Urban same-day and express delivery service in major Algerian metropolises', 'DZ', true, true, '{
        "api_base_url": "https://api.maystro-delivery.com/v1",
        "api_key_configured": true
    }'::jsonb, '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": true,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": true
    }'::jsonb),
    ('in_house', 'Khidmatik Direct Fleet', 'in_house', 'Khidmatik verified internal delivery messengers and store couriers', 'DZ', true, false, '{}'::jsonb, '{
        "supports_tracking": true,
        "supports_pickup": true,
        "supports_cod": true,
        "supports_cancellation": true,
        "supports_label_generation": true,
        "supports_webhooks": false,
        "supports_shipping_calculation": true,
        "supports_return": true,
        "supports_address_validation": false
    }'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
