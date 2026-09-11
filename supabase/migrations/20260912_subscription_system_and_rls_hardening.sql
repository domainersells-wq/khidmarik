-- ==============================================================================
-- KHIDMATIK PRODUCTION SUBSCRIPTION SYSTEM & SECURITY HARDENING MIGRATION
-- Migration Date: 2026-09-12
-- Target: Subscriptions, Store & User Billing, Constraints, and Strict RLS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 0. HELPER SECURITY FUNCTIONS (Ensures Self-Contained Execution)
-- ==============================================================================

-- Helper: Check if authenticated user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
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
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (upper(role) = 'SUPER_ADMIN' OR upper(role) = 'FINANCE' OR upper(role) = 'ADMIN')
    );
$$;

-- Helper: Get store ID owned by current authenticated user
CREATE OR REPLACE FUNCTION get_user_store_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM stores WHERE owner_id = p_user_id LIMIT 1;
$$;

-- ==============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'free', 'basic', 'pro', 'premium_annual'
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    price_yearly NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    tier INT DEFAULT 1 NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    limits JSONB DEFAULT '{"maxProducts": 50, "commissionDiscount": 0, "featuredDays": 0}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. STORE SUBSCRIPTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS store_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'pending_payment' NOT NULL, -- 'active', 'trial', 'expired', 'cancelled', 'pending_payment'
    billing_cycle VARCHAR(20) DEFAULT 'monthly' NOT NULL, -- 'monthly', 'yearly'
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
    canceled_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50), -- 'edahabia', 'baridimob', 'wallet', 'cib', 'bank_transfer'
    transaction_reference VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. SUBSCRIPTION PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES store_subscriptions(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES subscription_plans(id),
    amount_da NUMERIC(12, 2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(150),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'confirmed', 'failed', 'refunded'
    notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 4. INSERT DEFAULT SUBSCRIPTION PLANS (IF NOT EXISTS)
-- ==============================================================================
INSERT INTO subscription_plans (id, name, name_ar, slug, description, price_monthly, price_yearly, tier, features, limits, is_active)
VALUES
  (
    'free',
    'Starter Store',
    'المتجر المبتدئ (مجاني)',
    'starter-store',
    'خطة البدء المجانية لجميع التجار المبتدئين لعرض المنتجات الأساسية.',
    0.00,
    0.00,
    1,
    '["عرض حتى 20 منتج", "عمولة منصة 10%", "دعم فني عبر التذاكر", "تقارير مبيعات شهرية"]'::jsonb,
    '{"maxProducts": 20, "commissionRate": 0.10, "featuredDays": 0, "smsAlerts": false}'::jsonb,
    true
  ),
  (
    'basic',
    'Growth Merchant',
    'التاجر الصاعد (أساسي)',
    'growth-merchant',
    'خطة مثالية للمتاجر النشطة الراغبة في توسيع مبيعاتها والاستفادة من عمولة مخفضة.',
    2500.00,
    25000.00,
    2,
    '["عرض حتى 150 منتج", "عمولة مخفضة 7%", "حماية الشحنات المرتجعة 30%", "شارة متجر موثق", "إشعارات SMS فورية"]'::jsonb,
    '{"maxProducts": 150, "commissionRate": 0.07, "featuredDays": 3, "smsAlerts": true}'::jsonb,
    true
  ),
  (
    'pro',
    'Professional Brand',
    'العلامة الاحترافية (برو)',
    'pro-brand',
    'خطة متقدمة للمتاجر الكبرى والشركات مع حماية شحن متقدمة وعمولة منخفضة.',
    5900.00,
    59000.00,
    3,
    '["عرض منتجات غير محدود", "عمولة مخفضة 5%", "حماية شحنات مرتجعة 60%", "أولوية ظهور في نتائج البحث", "مدير حساب مخصص", "أدوات تحليلات متقدمة"]'::jsonb,
    '{"maxProducts": 10000, "commissionRate": 0.05, "featuredDays": 10, "smsAlerts": true}'::jsonb,
    true
  ),
  (
    'premium_annual',
    'Enterprise VIP',
    'المؤسسات والموزعون (VIP)',
    'enterprise-vip',
    'شراكة استراتيجية سنوية مع أدوات ربط API وحملات تسويقية حصرية.',
    9900.00,
    95000.00,
    4,
    '["كافة ميزات Pro", "عمولة 4% فقط", "حماية شحنات 100%", "لافتة رئيسية في الصفحة الرئيسية", "تكامل API للمخزون", "دعم فني فوري 24/7"]'::jsonb,
    '{"maxProducts": 50000, "commissionRate": 0.04, "featuredDays": 30, "smsAlerts": true}'::jsonb,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits;

-- ==============================================================================
-- 5. PERFORMANCE INDEXES & CONSTRAINTS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store ON store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_status ON store_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_store ON subscription_payments(store_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date ON appointments(provider_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_date ON appointments(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_listed_parts_category ON listed_parts(category_slug);
CREATE INDEX IF NOT EXISTS idx_part_requests_category ON part_requests(category_slug);

-- ==============================================================================
-- 6. STRICT ROW LEVEL SECURITY (RLS) FOR SUBSCRIPTIONS & CRITICAL TABLES
-- ==============================================================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- A. Subscription Plans Policies: Public can read active plans, only admins can modify
DROP POLICY IF EXISTS "Public can view active subscription plans" ON subscription_plans;
CREATE POLICY "Public can view active subscription plans" ON subscription_plans
FOR SELECT USING (is_active = true OR is_admin_or_super());

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
FOR ALL USING (is_admin_or_super()) WITH CHECK (is_admin_or_super());

-- B. Store Subscriptions Policies: Store owners can view their subscriptions, Admins can manage
DROP POLICY IF EXISTS "Store owners can view their subscriptions" ON store_subscriptions;
CREATE POLICY "Store owners can view their subscriptions" ON store_subscriptions
FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Store owners can request subscription" ON store_subscriptions;
CREATE POLICY "Store owners can request subscription" ON store_subscriptions
FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Admins and owners can update subscriptions" ON store_subscriptions;
CREATE POLICY "Admins and owners can update subscriptions" ON store_subscriptions
FOR UPDATE USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
) WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
);

-- C. Subscription Payments Policies
DROP POLICY IF EXISTS "Store owners can view their subscription payments" ON subscription_payments;
CREATE POLICY "Store owners can view their subscription payments" ON subscription_payments
FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
    OR is_finance_or_super()
);

DROP POLICY IF EXISTS "Store owners can submit subscription payments" ON subscription_payments;
CREATE POLICY "Store owners can submit subscription payments" ON subscription_payments
FOR INSERT WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    OR is_admin_or_super()
);

DROP POLICY IF EXISTS "Finance and Admins can manage subscription payments" ON subscription_payments;
CREATE POLICY "Finance and Admins can manage subscription payments" ON subscription_payments
FOR ALL USING (is_admin_or_super() OR is_finance_or_super())
WITH CHECK (is_admin_or_super() OR is_finance_or_super());

-- ==============================================================================
-- 7. AUDIT LOG TRIGGER HELPER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        timezone('utc'::text, now())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
