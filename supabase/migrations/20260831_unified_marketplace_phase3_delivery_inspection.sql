-- ==============================================================================================
-- KHIDMATIK UNIFIED MARKETPLACE ARCHITECTURE - PHASE 3 DELIVERY INSPECTION MIGRATION
-- Migration Name: 20260831_unified_marketplace_phase3_delivery_inspection.sql
-- Description: Configurable Delivery Inspection Sessions, Minimum Inspection Period,
--              Early Acceptance / Skip Timer Mechanism, and Anti-Fraud Verification.
-- ==============================================================================================

-- 1. Inspection Platform Settings Table (Admin-Controlled & Database-Driven)
CREATE TABLE IF NOT EXISTS public.platform_inspection_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(64) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by VARCHAR(64),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed Default Inspection Settings
INSERT INTO public.platform_inspection_settings (setting_key, setting_value, description)
VALUES
    ('inspection_duration_minutes', '15'::jsonb, 'Standard customer inspection window at doorstep (minutes)'),
    ('minimum_inspection_minutes', '5'::jsonb, 'Minimum inspection period before early acceptance bypass is unlocked (minutes)'),
    ('allow_early_acceptance', 'true'::jsonb, 'Whether customer can confirm acceptance early after minimum inspection time'),
    ('allow_early_acceptance_after_minutes', '5'::jsonb, 'Elapsed time in minutes required before showing early acceptance button'),
    ('inspection_expiration_action', '"require_decision"'::jsonb, 'Action on expiry: require_decision | auto_reject | contact_support'),
    ('max_evidence_photos', '5'::jsonb, 'Maximum number of evidence photos customer can attach for rejection'),
    ('require_evidence_for_damage', 'true'::jsonb, 'Whether photo evidence is mandatory when reporting damaged goods'),
    ('delivery_code_length', '6'::jsonb, 'Length of private customer delivery confirmation code (e.g. 6 digits)'),
    ('max_delivery_code_attempts', '5'::jsonb, 'Maximum failed verification code attempts before lockout')
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value, updated_at = timezone('utc'::text, now());

-- 2. Enhanced Configurable Rejection Reasons Table
CREATE TABLE IF NOT EXISTS public.inspection_rejection_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(32) NOT NULL, -- 'SELLER', 'BUYER', 'COURIER', 'OTHER'
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description TEXT,
    requires_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed Standard Rejection Reasons
INSERT INTO public.inspection_rejection_reasons (code, category, title_ar, title_en, requires_evidence, display_order)
VALUES
    -- Seller Fault Reasons
    ('wrong_product', 'SELLER', 'استلام منتج خاطئ تماماً مختلف عن المطلوب', 'Received completely wrong product', true, 1),
    ('wrong_variant', 'SELLER', 'المقاس أو اللون أو المواصفات غير مطابقة للطلب', 'Wrong size, color, or variant', true, 2),
    ('wrong_quantity', 'SELLER', 'الكمية المستلمة ناقصة أو غير صحيحة', 'Incorrect or incomplete quantity', false, 3),
    ('damaged_product', 'SELLER', 'المنتج مكسور أو متضرر من المصدر', 'Product damaged/defective from origin', true, 4),
    ('missing_accessories', 'SELLER', 'نقص في الملحقات أو الكابلات الأساسية', 'Missing essential accessories or cables', true, 5),
    ('product_not_as_described', 'SELLER', 'المنتج لا يطابق المواصفات والصور المعروضة في المتجر', 'Product does not match store description', true, 6),
    ('seller_error', 'SELLER', 'خطأ عام من طرف المتجر/البائع', 'General merchant error', false, 7),

    -- Buyer Fault Reasons
    ('changed_mind', 'BUYER', 'تغيير الرأي وعدم الرغبة في الشراء', 'Customer changed mind', false, 10),
    ('ordered_by_mistake', 'BUYER', 'تم الطلب عن طريق الخطأ', 'Ordered by mistake', false, 11),
    ('no_longer_needed', 'BUYER', 'لم أعد بحاجة إلى المنتج', 'No longer needed', false, 12),
    ('wrong_variant_selected', 'BUYER', 'اخترت مقاساً أو مواصفة خاطئة بنفسي أثناء الطلب', 'Selected wrong variant during checkout', false, 13),
    ('customer_refused', 'BUYER', 'رفض الاستلام دون إبداء أسباب تفصيلية', 'Customer refused parcel', false, 14),

    -- Courier Fault Reasons
    ('damaged_during_transport', 'COURIER', 'تضرر الطرد والكرتون بسبب سوء المعاملة أثناء النقل', 'Parcel damaged during transportation', true, 20),
    ('courier_error', 'COURIER', 'خطأ من مندوب أو شركة الشحن', 'Courier/Driver delivery error', false, 21),
    ('package_problem', 'COURIER', 'تمزق الطرد الخارجي أو تسرب محتوياته', 'Package torn or compromised', true, 22),

    -- Other
    ('other', 'OTHER', 'أسباب أخرى (يرجى التوضيح في الملاحظات)', 'Other reason (specify in notes)', false, 30)
ON CONFLICT (code) DO UPDATE 
SET title_ar = EXCLUDED.title_ar, title_en = EXCLUDED.title_en, requires_evidence = EXCLUDED.requires_evidence;

-- 3. Enhance delivery_inspection_sessions Table with Early Acceptance Attributes
DO $$ BEGIN
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS minimum_inspection_minutes INT NOT NULL DEFAULT 5;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS early_acceptance_available_at TIMESTAMPTZ;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS acceptance_method VARCHAR(32) DEFAULT 'normal_acceptance'; -- 'normal_acceptance', 'early_acceptance', 'admin_override'
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS rejection_notes TEXT;
    ALTER TABLE public.delivery_inspection_sessions ADD COLUMN IF NOT EXISTS rejection_category VARCHAR(32);
EXCEPTION WHEN others THEN null;
END $$;

-- 4. Concurrency Guard: Unique Active Inspection Session Per Shipment
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_inspection 
ON public.delivery_inspection_sessions(shipment_id) 
WHERE status IN ('initiated', 'inspecting');

-- 5. Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_tracking ON public.delivery_inspection_sessions(tracking_number);
CREATE INDEX IF NOT EXISTS idx_inspection_expires_at ON public.delivery_inspection_sessions(expires_at) WHERE status = 'inspecting';
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_cat ON public.inspection_rejection_reasons(category);

-- 6. Row Level Security Policies
ALTER TABLE public.platform_inspection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_rejection_reasons ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read rejection reasons and settings
CREATE POLICY "Authenticated users can read rejection reasons"
    ON public.inspection_rejection_reasons FOR SELECT
    USING (is_active = true);

CREATE POLICY "Authenticated users can read inspection settings"
    ON public.platform_inspection_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins full management for inspection settings"
    ON public.platform_inspection_settings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins full management for rejection reasons"
    ON public.inspection_rejection_reasons FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'role' = 'admin');
