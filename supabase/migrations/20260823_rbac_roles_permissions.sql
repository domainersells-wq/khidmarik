-- ==============================================================================
-- KHIDMATIK ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS MIGRATION
-- Multi-Role Engine & Row-Level Security Policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ROLES TABLE (ENUMERATION)
CREATE TABLE IF NOT EXISTS app_roles (
    id VARCHAR(50) PRIMARY KEY, -- 'SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT', 'FINANCE', 'STORE_OWNER', 'SERVICE_PROVIDER', 'CUSTOMER', 'DELIVERY'
    display_name_ar VARCHAR(100) NOT NULL,
    display_name_en VARCHAR(100) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed core roles
INSERT INTO app_roles (id, display_name_ar, display_name_en, description_ar, description_en)
VALUES
    ('SUPER_ADMIN', 'المدير العام الأعلى', 'Super Administrator', 'تحكم وصلاحيات كاملة وغير مقيدة على كافة أقسام المنصة', 'Unrestricted full access across all platform modules'),
    ('ADMIN', 'مدير النظام', 'Administrator', 'إدارة العمليات اليومية والمستخدمين والمتاجر والإعدادات', 'Manage daily operations, users, stores, and settings'),
    ('MODERATOR', 'المشرف', 'Moderator', 'مراجعة المحتوى والتقييمات وتوثيق الحسابات', 'Content moderation, review approvals, and verification'),
    ('SUPPORT', 'فريق الدعم الفني', 'Support Agent', 'متابعة تذاكر الدعم والنزاعات ومساعدة العملاء والمزودين', 'Handle support tickets, disputes, and customer assistance'),
    ('FINANCE', 'الإدارة المالية والمحاسبة', 'Finance Manager', 'متابعة المدفوعات والوساطة المالية والتسويات وعمليات السحب', 'Manage payments, escrow, settlements, and withdrawals'),
    ('STORE_OWNER', 'تاجر / صاحب متجر', 'Store Owner', 'إدارة المتجر والمنتجات والمخزون والطلبات وبوالص الشحن', 'Manage store, products, inventory, orders, and waybills'),
    ('SERVICE_PROVIDER', 'مزود خدمة / حرفي', 'Service Provider', 'إدارة الخدمات والمواعيد والحجوزات والمحفظة المالية', 'Manage services, appointments, bookings, and earnings'),
    ('DELIVERY', 'مندوب توصيل', 'Delivery Courier', 'إدارة وتحديث حالات التوصيل والشحنات الميدانية', 'Handle parcel dispatch, delivery status, and waybills'),
    ('CUSTOMER', 'عميل / مشتري', 'Customer', 'تصفح المنصة وإجراء الطلبات والحجوزات والتقييمات', 'Browse platform, place orders, book services, and rate')
ON CONFLICT (id) DO NOTHING;

-- 2. USER ROLES (MULTI-ROLE MAPPING)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    assigned_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 3. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS app_permissions (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    description_ar VARCHAR(255) NOT NULL,
    description_en VARCHAR(255) NOT NULL
);

INSERT INTO app_permissions (id, category, description_ar, description_en)
VALUES
    ('manage_all', 'system', 'صلاحية الإدارة الشاملة للنظام', 'Full system management'),
    ('manage_users', 'users', 'إدارة حسابات المستخدمين والأدوار', 'Manage users and roles'),
    ('manage_providers', 'services', 'إدارة وتوثيق الحرفيين ومزودي الخدمات', 'Manage service providers'),
    ('manage_stores', 'ecommerce', 'إدارة المتاجر والتجار الموثقين', 'Manage stores and vendors'),
    ('manage_products', 'ecommerce', 'إدارة المنتجات والمخزون والتصنيفات', 'Manage products and stock'),
    ('manage_orders', 'orders', 'إدارة وتعديل وتتبع الطلبات', 'Manage customer orders'),
    ('manage_bookings', 'services', 'إدارة الحجوزات والمواعيد والقاعات', 'Manage service bookings'),
    ('manage_payments', 'finance', 'إدارة المعاملات والمدفوعات والمحافظ', 'Manage financial transactions'),
    ('manage_reviews', 'content', 'إدارة ومراجعة تقييمات المنصة', 'Manage ratings and reviews'),
    ('manage_disputes', 'finance', 'فض النزاعات والتحكيم المالي للضمان', 'Resolve disputes and escrow'),
    ('manage_withdrawals', 'finance', 'مراجعة والموافقة على سحوبات الأرصدة', 'Approve payout withdrawals'),
    ('manage_settings', 'system', 'إدارة الإعدادات العامة والسياسات', 'Manage platform settings'),
    ('view_analytics', 'analytics', 'الاطلاع على التقارير والإحصائيات', 'View analytics and reports'),
    ('manage_content', 'content', 'إدارة محتوى المنصة واللافتات', 'Manage platform content'),
    ('manage_delivery', 'logistics', 'إدارة الشحن وتحديث بوالص التوصيل', 'Manage parcel delivery')
ON CONFLICT (id) DO NOTHING;

-- 4. ROLE PERMISSIONS ASSIGNMENT TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES app_roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) REFERENCES app_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. SQL HELPER FUNCTIONS FOR SECURITY DEFINER RLS
CREATE OR REPLACE FUNCTION auth_has_role(p_role VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND (role = p_role OR role = 'SUPER_ADMIN')
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND (upper(role) = upper(p_role) OR upper(role) = 'SUPER_ADMIN')
    );
$$;

CREATE OR REPLACE FUNCTION auth_has_permission(p_permission VARCHAR(100))
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role
        WHERE ur.user_id = auth.uid() AND (rp.permission_id = p_permission OR ur.role = 'SUPER_ADMIN')
    ) OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND upper(role) = 'SUPER_ADMIN'
    );
$$;

-- 6. RLS POLICIES FOR SECURE ROLE ACCESS

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read role definitions and permissions
CREATE POLICY "Public can view app roles" ON app_roles FOR SELECT USING (true);
CREATE POLICY "Public can view app permissions" ON app_permissions FOR SELECT USING (true);
CREATE POLICY "Public can view role permissions" ON role_permissions FOR SELECT USING (true);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id OR auth_has_role('SUPER_ADMIN') OR auth_has_role('ADMIN'));

CREATE POLICY "Super Admins and Admins can manage user roles"
ON user_roles FOR ALL
USING (auth_has_role('SUPER_ADMIN') OR auth_has_role('ADMIN'))
WITH CHECK (auth_has_role('SUPER_ADMIN') OR auth_has_role('ADMIN'));
