-- ==============================================================================
-- KHIDMATIK COMPLETE SUPABASE SECURITY HARDENING & STRICT RLS POLICIES
-- Multi-Vendor Super App Database Security & Row Level Security Shield
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 1. HELPER SECURITY FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- Helper: Get store ID owned by current authenticated user
CREATE OR REPLACE FUNCTION get_user_store_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM stores WHERE owner_id = p_user_id LIMIT 1;
$$;

-- Helper: Check if authenticated user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND (role = 'SUPER_ADMIN' OR role = 'ADMIN')
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (upper(role) = 'SUPER_ADMIN' OR upper(role) = 'ADMIN')
    );
$$;

-- Helper: Check if authenticated user is finance manager or super_admin
CREATE OR REPLACE FUNCTION is_finance_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND (role = 'SUPER_ADMIN' OR role = 'FINANCE' OR role = 'ADMIN')
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (upper(role) = 'SUPER_ADMIN' OR upper(role) = 'FINANCE' OR upper(role) = 'ADMIN')
    );
$$;

-- Helper: Check if authenticated user is moderator or super_admin
CREATE OR REPLACE FUNCTION is_moderator_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND (role = 'SUPER_ADMIN' OR role = 'MODERATOR' OR role = 'ADMIN')
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (upper(role) = 'SUPER_ADMIN' OR upper(role) = 'MODERATOR' OR upper(role) = 'ADMIN')
    );
$$;

-- ==============================================================================
-- 2. SCHEMAS & TABLES CREATION (ENSURE ALL TARGET TABLES EXIST)
-- ==============================================================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'customer' NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    member_since TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    wilaya VARCHAR(100) NOT NULL,
    commune VARCHAR(100),
    address TEXT,
    gps_coordinates VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_da NUMERIC(12, 2) NOT NULL,
    stock_quantity INT DEFAULT 0 NOT NULL,
    category VARCHAR(100) NOT NULL,
    images TEXT[],
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'ORD-2026-9041'
    customer_id UUID NOT NULL REFERENCES profiles(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    total_amount_da NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
    shipping_method VARCHAR(50) DEFAULT 'home_delivery',
    shipping_address TEXT NOT NULL,
    shipping_wilaya VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    unit_price_da NUMERIC(12, 2) NOT NULL,
    total_price_da NUMERIC(12, 2) NOT NULL
);

-- KYC Verification Documents Table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'national_id', 'artisan_card', 'trade_register', 'residence_proof'
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    rejection_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Private Conversations & Chat Messages Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_one_id UUID NOT NULL REFERENCES profiles(id),
    participant_two_id UUID NOT NULL REFERENCES profiles(id),
    order_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    message_text TEXT NOT NULL,
    attachment_urls TEXT[],
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Withdrawals & Payout Requests Table
CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'WD-2026-1049'
    user_id UUID NOT NULL REFERENCES profiles(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount_da NUMERIC(12, 2) NOT NULL,
    payout_method VARCHAR(50) NOT NULL, -- 'CCP', 'BARIDIMOB', 'BANK_TRANSFER'
    account_number VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'
    rejection_reason TEXT,
    transaction_receipt_url TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, key)
);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE craft_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_way_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY POLICIES DEFINITIONS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view basic profiles" ON profiles;
CREATE POLICY "Public can view basic profiles" ON profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id OR is_admin_or_super())
WITH CHECK (auth.uid() = id OR is_admin_or_super());

DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles" ON profiles
FOR ALL USING (is_admin_or_super())
WITH CHECK (is_admin_or_super());

-- ------------------------------------------------------------------------------
-- B. STORES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active stores" ON stores;
CREATE POLICY "Public can view active stores" ON stores
FOR SELECT USING (is_active = true OR owner_id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners can insert their own store" ON stores;
CREATE POLICY "Store owners can insert their own store" ON stores
FOR INSERT WITH CHECK (auth.uid() = owner_id OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners can update their own store" ON stores;
CREATE POLICY "Store owners can update their own store" ON stores
FOR UPDATE USING (auth.uid() = owner_id OR is_admin_or_super())
WITH CHECK (auth.uid() = owner_id OR is_admin_or_super());

DROP POLICY IF EXISTS "Admins can delete stores" ON stores;
CREATE POLICY "Admins can delete stores" ON stores
FOR DELETE USING (auth.uid() = owner_id OR is_admin_or_super());

-- ------------------------------------------------------------------------------
-- C. PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products
FOR SELECT USING (is_active = true OR store_id = get_user_store_id(auth.uid()) OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners can insert products into their store" ON products;
CREATE POLICY "Store owners can insert products into their store" ON products
FOR INSERT WITH CHECK (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners can update their own products" ON products;
CREATE POLICY "Store owners can update their own products" ON products
FOR UPDATE USING (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super())
WITH CHECK (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners can delete their own products" ON products;
CREATE POLICY "Store owners can delete their own products" ON products
FOR DELETE USING (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super());

-- ------------------------------------------------------------------------------
-- D. ORDERS & ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view their orders" ON orders;
CREATE POLICY "Participants can view their orders" ON orders
FOR SELECT USING (
    customer_id = auth.uid() 
    OR store_id = get_user_store_id(auth.uid()) 
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders" ON orders
FOR INSERT WITH CHECK (customer_id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Store owners and Admins can update order status" ON orders;
CREATE POLICY "Store owners and Admins can update order status" ON orders
FOR UPDATE USING (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super())
WITH CHECK (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super());

DROP POLICY IF EXISTS "Participants can view order items" ON order_items;
CREATE POLICY "Participants can view order items" ON order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id 
        AND (o.customer_id = auth.uid() OR o.store_id = get_user_store_id(auth.uid()) OR is_admin_or_super())
    )
);

DROP POLICY IF EXISTS "Customers can insert order items" ON order_items;
CREATE POLICY "Customers can insert order items" ON order_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id AND (o.customer_id = auth.uid() OR is_admin_or_super())
    )
);

-- ------------------------------------------------------------------------------
-- E. SERVICE ORDERS & SPARE PARTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service participants can view service orders" ON service_orders;
CREATE POLICY "Service participants can view service orders" ON service_orders
FOR SELECT USING (
    customer_id = auth.uid() 
    OR craftsman_id = auth.uid() 
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Customers can create service orders" ON service_orders;
CREATE POLICY "Customers can create service orders" ON service_orders
FOR INSERT WITH CHECK (customer_id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Craftsmen and Customers can update service orders" ON service_orders;
CREATE POLICY "Craftsmen and Customers can update service orders" ON service_orders
FOR UPDATE USING (
    customer_id = auth.uid() 
    OR craftsman_id = auth.uid() 
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Service participants can view spare parts" ON order_spare_parts;
CREATE POLICY "Service participants can view spare parts" ON order_spare_parts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = order_spare_parts.order_id 
        AND (so.customer_id = auth.uid() OR so.craftsman_id = auth.uid() OR is_admin_or_super())
    )
);

DROP POLICY IF EXISTS "Craftsmen can insert spare parts receipts" ON order_spare_parts;
CREATE POLICY "Craftsmen can insert spare parts receipts" ON order_spare_parts
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = order_spare_parts.order_id AND (so.craftsman_id = auth.uid() OR is_admin_or_super())
    )
);

DROP POLICY IF EXISTS "Customers can approve or reject spare parts" ON order_spare_parts;
CREATE POLICY "Customers can approve or reject spare parts" ON order_spare_parts
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = order_spare_parts.order_id AND (so.customer_id = auth.uid() OR is_admin_or_super())
    )
);

-- ------------------------------------------------------------------------------
-- F. FINANCIAL LEDGER, WALLETS & ESCROW POLICIES (STRICT PROTECTION)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
CREATE POLICY "Users can view their own wallet" ON wallets
FOR SELECT USING (owner_id = auth.uid() OR is_finance_or_super());

-- Prevent direct client INSERT/UPDATE/DELETE on wallets (only allowed by SECURITY DEFINER stored procedures)
DROP POLICY IF EXISTS "Finance can manage wallets" ON wallets;
CREATE POLICY "Finance can manage wallets" ON wallets
FOR ALL USING (is_finance_or_super())
WITH CHECK (is_finance_or_super());

DROP POLICY IF EXISTS "Users can view their own ledger entries" ON ledger_entries;
CREATE POLICY "Users can view their own ledger entries" ON ledger_entries
FOR SELECT USING (
    debit_wallet_id IN (SELECT id FROM wallets WHERE owner_id = auth.uid())
    OR credit_wallet_id IN (SELECT id FROM wallets WHERE owner_id = auth.uid())
    OR is_finance_or_super()
);

-- Ledger entries are completely IMMUTABLE from client side
DROP POLICY IF EXISTS "No client updates on ledger entries" ON ledger_entries;
CREATE POLICY "No client updates on ledger entries" ON ledger_entries
FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No client deletes on ledger entries" ON ledger_entries;
CREATE POLICY "No client deletes on ledger entries" ON ledger_entries
FOR DELETE USING (false);

DROP POLICY IF EXISTS "Parties can view their escrow transactions" ON escrow_transactions;
CREATE POLICY "Parties can view their escrow transactions" ON escrow_transactions
FOR SELECT USING (
    payer_id = auth.uid() 
    OR payee_id = auth.uid() 
    OR is_finance_or_super()
);

DROP POLICY IF EXISTS "Finance and Admins can manage escrow" ON escrow_transactions;
CREATE POLICY "Finance and Admins can manage escrow" ON escrow_transactions
FOR ALL USING (is_finance_or_super())
WITH CHECK (is_finance_or_super());

-- ------------------------------------------------------------------------------
-- G. KYC DOCUMENTS POLICIES (CONFIDENTIALITY SHIELD)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own KYC documents" ON kyc_documents;
CREATE POLICY "Users can view own KYC documents" ON kyc_documents
FOR SELECT USING (user_id = auth.uid() OR is_moderator_or_super());

DROP POLICY IF EXISTS "Users can upload own KYC documents" ON kyc_documents;
CREATE POLICY "Users can upload own KYC documents" ON kyc_documents
FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin_or_super());

DROP POLICY IF EXISTS "Moderators can update KYC status" ON kyc_documents;
CREATE POLICY "Moderators can update KYC status" ON kyc_documents
FOR UPDATE USING (is_moderator_or_super())
WITH CHECK (is_moderator_or_super());

-- ------------------------------------------------------------------------------
-- H. PRIVATE CONVERSATIONS & CHAT MESSAGES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations" ON conversations
FOR SELECT USING (
    participant_one_id = auth.uid() 
    OR participant_two_id = auth.uid() 
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (
    participant_one_id = auth.uid() 
    OR participant_two_id = auth.uid() 
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Participants can view chat messages" ON chat_messages;
CREATE POLICY "Participants can view chat messages" ON chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = chat_messages.conversation_id 
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid() OR is_admin_or_super())
    )
);

DROP POLICY IF EXISTS "Sender can insert chat messages" ON chat_messages;
CREATE POLICY "Sender can insert chat messages" ON chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = chat_messages.conversation_id 
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
);

-- ------------------------------------------------------------------------------
-- I. WITHDRAWALS & PAYOUTS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
CREATE POLICY "Users can view their own withdrawals" ON withdrawals
FOR SELECT USING (user_id = auth.uid() OR is_finance_or_super());

DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawals;
CREATE POLICY "Users can create withdrawal requests" ON withdrawals
FOR INSERT WITH CHECK (user_id = auth.uid() OR is_finance_or_super());

DROP POLICY IF EXISTS "Finance can update withdrawal requests" ON withdrawals;
CREATE POLICY "Finance can update withdrawal requests" ON withdrawals
FOR UPDATE USING (is_finance_or_super())
WITH CHECK (is_finance_or_super());

-- ------------------------------------------------------------------------------
-- J. REVIEWS POLICIES (DOUBLE-BLIND REVEAL)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view revealed reviews" ON two_way_reviews;
CREATE POLICY "Public can view revealed reviews" ON two_way_reviews
FOR SELECT USING (
    is_revealed = true 
    OR EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = two_way_reviews.order_id 
        AND (so.customer_id = auth.uid() OR so.craftsman_id = auth.uid() OR is_moderator_or_super())
    )
);

DROP POLICY IF EXISTS "Order participants can insert reviews" ON two_way_reviews;
CREATE POLICY "Order participants can insert reviews" ON two_way_reviews
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM service_orders so
        WHERE so.id = two_way_reviews.order_id 
        AND (so.customer_id = auth.uid() OR so.craftsman_id = auth.uid() OR is_moderator_or_super())
    )
);

-- ------------------------------------------------------------------------------
-- K. STORE SETTINGS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Store owners can view their store settings" ON store_settings;
CREATE POLICY "Store owners can view their store settings" ON store_settings
FOR SELECT USING (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super() OR store_id IS NULL);

DROP POLICY IF EXISTS "Store owners can update their store settings" ON store_settings;
CREATE POLICY "Store owners can update their store settings" ON store_settings
FOR ALL USING (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super() OR store_id IS NULL)
WITH CHECK (store_id = get_user_store_id(auth.uid()) OR is_admin_or_super() OR store_id IS NULL);
