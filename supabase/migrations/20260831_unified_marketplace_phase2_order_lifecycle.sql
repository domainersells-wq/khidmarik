-- ==============================================================================================
-- KHIDMATIK UNIFIED MARKETPLACE ARCHITECTURE - PHASE 2 ORDER LIFECYCLE MIGRATION
-- Migration Name: 20260831_unified_marketplace_phase2_order_lifecycle.sql
-- Description: Integration of Orders, Payments, Shipping, Multi-Seller partitioning,
--              Inventory Reservation, Financial Snapshots, and Idempotent Webhooks.
-- ==============================================================================================

-- 1. Inventory Reservations Table (Anti-Overselling Concurrency Engine)
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    reserved_quantity INT NOT NULL CHECK (reserved_quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVED', -- 'RESERVED', 'COMMITTED', 'RELEASED'
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 minutes'),
    released_at TIMESTAMPTZ,
    release_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inv_res_order ON public.inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inv_res_product ON public.inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_res_status ON public.inventory_reservations(status);

-- 2. Idempotency Keys Registry (Prevents Duplicate Webhooks and Duplicate Shipments)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    scope VARCHAR(64) NOT NULL, -- 'PAYMENT_WEBHOOK', 'SHIPMENT_CREATION', 'ORDER_CHECKOUT'
    resource_id VARCHAR(128),
    response_payload JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSING', -- 'PROCESSING', 'COMPLETED', 'FAILED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON public.idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_scope ON public.idempotency_keys(scope);

-- 3. Enhance Orders Table with Segregated Statuses and Financial Snapshots
DO $$ BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(32) DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_verification_status VARCHAR(32) DEFAULT 'pending';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS financial_snapshot JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_multi_seller BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS parent_order_id TEXT;
EXCEPTION WHEN others THEN null;
END $$;

-- 4. Order-to-Shipments Association Table (Multi-Seller & Multi-Package)
CREATE TABLE IF NOT EXISTS public.order_shipment_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    shipment_id TEXT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    shipping_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    package_index INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ord_ship_order ON public.order_shipment_mappings(order_id);
CREATE INDEX IF NOT EXISTS idx_ord_ship_seller ON public.order_shipment_mappings(seller_id);
CREATE INDEX IF NOT EXISTS idx_ord_ship_shipment ON public.order_shipment_mappings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ord_ship_tracking ON public.order_shipment_mappings(tracking_number);

-- 5. Row Level Security for Phase 2 Tables
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipment_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to inventory reservations"
    ON public.inventory_reservations FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full access to idempotency keys"
    ON public.idempotency_keys FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Sellers can view their order shipment mappings"
    ON public.order_shipment_mappings FOR SELECT
    USING (seller_id = (auth.jwt() ->> 'seller_id') OR seller_id = auth.uid()::text);

CREATE POLICY "Admins full access to order shipment mappings"
    ON public.order_shipment_mappings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
