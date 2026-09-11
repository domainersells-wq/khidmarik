-- ==============================================================================================
-- Khidmatik Marketplace - Customer Orders, Tracking, Escrow & Snapshot Database Schema
-- Migration: 20260823_customer_orders_system.sql
-- ==============================================================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE, -- Human-readable identifier: KHM-2026-000001
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    store_id VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'unfulfilled',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    shipping_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    platform_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    seller_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    payment_method VARCHAR(32) NOT NULL DEFAULT 'edahabia',
    payment_transaction_id VARCHAR(64),
    tracking_number VARCHAR(64),
    shipping_provider VARCHAR(64) DEFAULT 'yalidine',
    estimated_delivery_date TIMESTAMPTZ,
    protection_ends_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Order Items Snapshot Table (Frozen purchase records)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    seller_id VARCHAR(64) NOT NULL,
    store_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    sku VARCHAR(64),
    variant_id VARCHAR(64),
    variant_name VARCHAR(128),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 3. Order Shipping Address Snapshot Table
CREATE TABLE IF NOT EXISTS public.order_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    recipient_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'Algeria',
    wilaya VARCHAR(64) NOT NULL,
    commune VARCHAR(64) NOT NULL,
    address_line TEXT NOT NULL,
    postal_code VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Order Status History Table (Immutable audit trail)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    previous_status VARCHAR(32),
    description TEXT,
    changed_by VARCHAR(128) NOT NULL,
    changed_by_role VARCHAR(32) NOT NULL, -- 'CUSTOMER', 'SELLER', 'COURIER', 'ADMIN', 'SYSTEM'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);

-- 5. Payment & Escrow Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id VARCHAR(64) NOT NULL,
    payment_reference VARCHAR(64) NOT NULL UNIQUE,
    provider VARCHAR(32) NOT NULL, -- 'edahabia', 'baridimob', 'cib', 'cash_on_delivery'
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'held_in_escrow', 'released', 'refunded'
    transaction_type VARCHAR(32) NOT NULL, -- 'payment', 'escrow_hold', 'escrow_release', 'refund'
    provider_transaction_id VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON public.payment_transactions(order_id);

-- 6. Seller Wallets & Ledger Transactions
CREATE TABLE IF NOT EXISTS public.seller_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(64) NOT NULL UNIQUE,
    available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    pending_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
    total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.seller_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id VARCHAR(64) NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type VARCHAR(32) NOT NULL, -- 'sale_pending', 'sale_released', 'refund', 'commission', 'withdrawal'
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'DZD',
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    description TEXT NOT NULL,
    reference VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_seller_wallet_tx_seller ON public.seller_wallet_transactions(seller_id);

-- 7. Refund Requests & Disputes Table
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id VARCHAR(64) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    requested_amount NUMERIC(14, 2) NOT NULL,
    approved_amount NUMERIC(14, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'requested', -- 'requested', 'seller_review', 'approved', 'rejected', 'completed', 'disputed'
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    refund_request_id UUID REFERENCES public.refund_requests(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id VARCHAR(64) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'customer_won', 'seller_won', 'partial_refund', 'closed'
    resolution VARCHAR(64),
    resolved_by VARCHAR(128),
    mediator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own orders
CREATE POLICY "Customers can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id);

-- Sellers can view orders belonging to their store
CREATE POLICY "Sellers can view their store orders"
    ON public.orders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
    ));

-- Order Items customer view policy
CREATE POLICY "Customers can view their own order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    ));

-- Order Addresses customer view policy
CREATE POLICY "Customers can view their order address"
    ON public.order_addresses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_addresses.order_id AND orders.customer_id = auth.uid()
    ));

-- Order Status History customer view policy
CREATE POLICY "Customers can view order history"
    ON public.order_status_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_status_history.order_id AND orders.customer_id = auth.uid()
    ));

-- Refund Requests policy
CREATE POLICY "Customers can view and submit their own refund requests"
    ON public.refund_requests FOR ALL
    USING (auth.uid() = customer_id);
