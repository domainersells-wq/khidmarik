-- ==============================================================================
-- KHIDMATIK ON-DEMAND CRAFTSMEN & SOS SYSTEM MIGRATION
-- Extensions: pgcrypto for cryptographic OTP hashing and secure token generation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CRAFTSMAN PROFILES
CREATE TABLE IF NOT EXISTS craft_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    specialty_ar VARCHAR(150) NOT NULL,
    specialty_en VARCHAR(150) NOT NULL,
    badge VARCHAR(50) DEFAULT 'Verified Craftsman',
    average_rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews_count INT DEFAULT 0,
    completed_jobs_count INT DEFAULT 0,
    is_on_duty BOOLEAN DEFAULT TRUE,
    current_latitude NUMERIC(10, 7),
    current_longitude NUMERIC(10, 7),
    emergency_radius_km INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. WALLETS (ESCROW & SETTLEMENT)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    owner_type VARCHAR(30) NOT NULL, -- 'customer' | 'craftsman' | 'platform'
    balance_da NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    locked_escrow_da NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(10) DEFAULT 'DZD' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SERVICE ORDERS
CREATE TABLE IF NOT EXISTS service_orders (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'SOS-2026-8941'
    customer_id UUID NOT NULL,
    craftsman_id UUID,
    service_title_ar VARCHAR(255) NOT NULL,
    service_title_en VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    emergency_radius_km INT DEFAULT 8,
    status VARCHAR(50) DEFAULT 'REQUESTED' NOT NULL,
    -- 'REQUESTED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'PARTS_PENDING' | 'OTP_COMPLETED' | 'REVIEWED' | 'DISPUTED' | 'CANCELLED'
    
    -- Quotation & Financials
    labor_type VARCHAR(30) DEFAULT 'fixed_quote',
    labor_cost_da NUMERIC(10, 2) NOT NULL,
    emergency_surge_fee_da NUMERIC(10, 2) DEFAULT 0.00,
    total_parts_cost_da NUMERIC(10, 2) DEFAULT 0.00,
    platform_commission_rate NUMERIC(4, 3) DEFAULT 0.050,
    net_total_da NUMERIC(10, 2) NOT NULL,
    
    -- Cryptographic OTP Security Handshake
    start_otp_hash TEXT NOT NULL,
    start_otp_attempts INT DEFAULT 0 NOT NULL,
    is_start_otp_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    completion_otp_hash TEXT NOT NULL,
    completion_otp_attempts INT DEFAULT 0 NOT NULL,
    is_completion_otp_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    is_locked_out BOOLEAN DEFAULT FALSE NOT NULL,
    lockout_reason TEXT,
    
    -- Customer Location & Contact
    customer_wilaya VARCHAR(100) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ORDER SPARE PARTS (RECEIPT PROOFS)
CREATE TABLE IF NOT EXISTS order_spare_parts (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
    part_name_ar VARCHAR(255) NOT NULL,
    part_name_en VARCHAR(255) NOT NULL,
    price_da NUMERIC(10, 2) NOT NULL,
    quantity INT DEFAULT 1 NOT NULL,
    receipt_photo_url TEXT NOT NULL,
    receipt_thumbnail_url TEXT,
    status VARCHAR(30) DEFAULT 'pending_approval' NOT NULL, -- 'pending_approval' | 'approved' | 'rejected'
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. IMMUTABLE FINANCIAL LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) REFERENCES service_orders(id) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'PARTS_REIMBURSE' | 'PLATFORM_FEE' | 'REFUND'
    debit_wallet_id UUID REFERENCES wallets(id),
    credit_wallet_id UUID REFERENCES wallets(id),
    amount_da NUMERIC(12, 2) NOT NULL,
    platform_commission_da NUMERIC(10, 2) DEFAULT 0.00,
    reference_code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DOUBLE-BLIND TWO-WAY REVIEWS
CREATE TABLE IF NOT EXISTS two_way_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    -- Customer Evaluation
    customer_rating INT CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_punctuality BOOLEAN DEFAULT TRUE,
    customer_cleanliness BOOLEAN DEFAULT TRUE,
    customer_technical_skill BOOLEAN DEFAULT TRUE,
    customer_pricing_fair BOOLEAN DEFAULT TRUE,
    customer_comment TEXT,
    customer_submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Craftsman Evaluation
    craftsman_rating INT CHECK (craftsman_rating >= 1 AND craftsman_rating <= 5),
    craftsman_safety_respect BOOLEAN DEFAULT TRUE,
    craftsman_payment_prompt BOOLEAN DEFAULT TRUE,
    craftsman_work_area_safe BOOLEAN DEFAULT TRUE,
    craftsman_comment TEXT,
    craftsman_submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Double-Blind Reveal Governance
    is_revealed BOOLEAN DEFAULT FALSE NOT NULL,
    auto_reveal_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    revealed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. JOB MEDIA VERIFICATIONS (BEFORE & AFTER)
CREATE TABLE IF NOT EXISTS job_media_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    before_photo_url TEXT,
    before_timestamp TIMESTAMP WITH TIME ZONE,
    before_notes TEXT,
    after_photo_url TEXT,
    after_timestamp TIMESTAMP WITH TIME ZONE,
    after_notes TEXT,
    showcase_in_portfolio BOOLEAN DEFAULT TRUE,
    customer_anonymity_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- STORED PROCEDURES & TRIGGERS
-- ==============================================================================

-- FUNCTION 1: VERIFY DUAL-STEP CRYPTOGRAPHIC OTP
CREATE OR REPLACE FUNCTION verify_service_order_otp(
    p_order_id VARCHAR(50),
    p_input_otp VARCHAR(10),
    p_otp_type VARCHAR(20) -- 'START' or 'COMPLETION'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_is_match BOOLEAN;
    v_max_attempts INT := 3;
BEGIN
    SELECT * INTO v_order FROM service_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    IF v_order.is_locked_out THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_LOCKED_OUT', 'lockoutReason', v_order.lockout_reason);
    END IF;

    IF p_otp_type = 'START' THEN
        IF v_order.is_start_otp_verified THEN
            RETURN jsonb_build_object('success', true, 'message', 'START_OTP_ALREADY_VERIFIED');
        END IF;

        -- Cryptographic verification using crypt with stored salt hash
        v_is_match := (crypt(p_input_otp, v_order.start_otp_hash) = v_order.start_otp_hash);

        IF v_is_match THEN
            UPDATE service_orders
            SET is_start_otp_verified = TRUE,
                status = 'IN_PROGRESS',
                updated_at = timezone('utc'::text, now())
            WHERE id = p_order_id;
            
            RETURN jsonb_build_object('success', true, 'status', 'IN_PROGRESS');
        ELSE
            UPDATE service_orders
            SET start_otp_attempts = start_otp_attempts + 1,
                is_locked_out = (start_otp_attempts + 1 >= v_max_attempts),
                lockout_reason = CASE WHEN (start_otp_attempts + 1 >= v_max_attempts) 
                                      THEN 'Maximum Start OTP attempts exceeded. Escalate to Super Admin.' 
                                      ELSE NULL END,
                status = CASE WHEN (start_otp_attempts + 1 >= v_max_attempts) THEN 'DISPUTED' ELSE status END,
                updated_at = timezone('utc'::text, now())
            WHERE id = p_order_id;

            RETURN jsonb_build_object(
                'success', false, 
                'error', 'INVALID_OTP', 
                'attemptsRemaining', GREATEST(0, v_max_attempts - (v_order.start_otp_attempts + 1)),
                'isLockedOut', (v_order.start_otp_attempts + 1 >= v_max_attempts)
            );
        END IF;

    ELSIF p_otp_type = 'COMPLETION' THEN
        IF v_order.is_completion_otp_verified THEN
            RETURN jsonb_build_object('success', true, 'message', 'COMPLETION_OTP_ALREADY_VERIFIED');
        END IF;

        v_is_match := (crypt(p_input_otp, v_order.completion_otp_hash) = v_order.completion_otp_hash);

        IF v_is_match THEN
            UPDATE service_orders
            SET is_completion_otp_verified = TRUE,
                status = 'OTP_COMPLETED',
                updated_at = timezone('utc'::text, now())
            WHERE id = p_order_id;
            
            -- Automatically trigger financial settlement
            PERFORM process_order_financial_settlement(p_order_id);

            RETURN jsonb_build_object('success', true, 'status', 'OTP_COMPLETED');
        ELSE
            UPDATE service_orders
            SET completion_otp_attempts = completion_otp_attempts + 1,
                is_locked_out = (completion_otp_attempts + 1 >= v_max_attempts),
                lockout_reason = CASE WHEN (completion_otp_attempts + 1 >= v_max_attempts) 
                                      THEN 'Maximum Completion OTP attempts exceeded. Escalate to Super Admin.' 
                                      ELSE NULL END,
                status = CASE WHEN (completion_otp_attempts + 1 >= v_max_attempts) THEN 'DISPUTED' ELSE status END,
                updated_at = timezone('utc'::text, now())
            WHERE id = p_order_id;

            RETURN jsonb_build_object(
                'success', false, 
                'error', 'INVALID_OTP', 
                'attemptsRemaining', GREATEST(0, v_max_attempts - (v_order.completion_otp_attempts + 1)),
                'isLockedOut', (v_order.completion_otp_attempts + 1 >= v_max_attempts)
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('success', false, 'error', 'INVALID_OTP_TYPE');
END;
$$;

-- FUNCTION 2: PROCESS AUTOMATED FINANCIAL SETTLEMENT & ESCROW RECONCILIATION
CREATE OR REPLACE FUNCTION process_order_financial_settlement(
    p_order_id VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_parts_total NUMERIC(12, 2);
    v_subtotal NUMERIC(12, 2);
    v_platform_fee NUMERIC(12, 2);
    v_craftsman_payout NUMERIC(12, 2);
    v_customer_wallet_id UUID;
    v_craftsman_wallet_id UUID;
    v_platform_wallet_id UUID;
BEGIN
    SELECT * INTO v_order FROM service_orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    -- Calculate approved parts cost
    SELECT COALESCE(SUM(price_da * quantity), 0.00) INTO v_parts_total 
    FROM order_spare_parts 
    WHERE order_id = p_order_id AND status = 'approved';

    v_subtotal := v_order.labor_cost_da + v_order.emergency_surge_fee_da + v_parts_total;
    v_platform_fee := ROUND(v_subtotal * v_order.platform_commission_rate, 2);
    v_craftsman_payout := v_subtotal - v_platform_fee;

    -- Update Order net total
    UPDATE service_orders
    SET total_parts_cost_da = v_parts_total,
        net_total_da = v_subtotal,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_order_id;

    -- Create or fetch wallets
    SELECT id INTO v_customer_wallet_id FROM wallets WHERE owner_id = v_order.customer_id LIMIT 1;
    SELECT id INTO v_craftsman_wallet_id FROM wallets WHERE owner_id = v_order.craftsman_id LIMIT 1;
    SELECT id INTO v_platform_wallet_id FROM wallets WHERE owner_type = 'platform' LIMIT 1;

    -- Credit craftsman wallet with net earnings
    IF v_craftsman_wallet_id IS NOT NULL THEN
        UPDATE wallets 
        SET balance_da = balance_da + v_craftsman_payout,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_craftsman_wallet_id;
    END IF;

    -- Record immutable Ledger Entry for Craftsman Payout
    INSERT INTO ledger_entries (
        order_id,
        transaction_type,
        debit_wallet_id,
        credit_wallet_id,
        amount_da,
        platform_commission_da,
        reference_code,
        description
    ) VALUES (
        p_order_id,
        'ESCROW_RELEASE',
        v_customer_wallet_id,
        v_craftsman_wallet_id,
        v_craftsman_payout,
        v_platform_fee,
        'LEDGER-SETTLE-' || p_order_id || '-' || floor(random()*899999+100000)::text,
        'Escrow release for completed order ' || p_order_id || ' (Labor + Approved Parts - Platform Commission)'
    );

    -- Increment craftsman completed jobs count
    IF v_order.craftsman_id IS NOT NULL THEN
        UPDATE craft_profiles
        SET completed_jobs_count = completed_jobs_count + 1,
            updated_at = timezone('utc'::text, now())
        WHERE user_id = v_order.craftsman_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payoutDA', v_craftsman_payout,
        'platformFeeDA', v_platform_fee,
        'partsCostDA', v_parts_total
    );
END;
$$;

-- FUNCTION 3: DOUBLE-BLIND REVIEW REVEAL TRIGGER
CREATE OR REPLACE FUNCTION trg_check_and_reveal_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_craftsman_user_id UUID;
    v_new_avg NUMERIC(3, 2);
    v_total_reviews INT;
BEGIN
    -- Check if both parties submitted review
    IF NEW.customer_rating IS NOT NULL AND NEW.craftsman_rating IS NOT NULL AND NOT NEW.is_revealed THEN
        NEW.is_revealed := TRUE;
        NEW.revealed_at := timezone('utc'::text, now());
        
        -- Update order status to REVIEWED
        UPDATE service_orders SET status = 'REVIEWED' WHERE id = NEW.order_id;
        
        -- Recalculate craftsman average rating
        SELECT so.craftsman_id INTO v_craftsman_user_id
        FROM service_orders so WHERE so.id = NEW.order_id;

        IF v_craftsman_user_id IS NOT NULL THEN
            SELECT 
                ROUND(AVG(twr.customer_rating), 2),
                COUNT(twr.id)
            INTO v_new_avg, v_total_reviews
            FROM two_way_reviews twr
            JOIN service_orders so ON so.id = twr.order_id
            WHERE so.craftsman_id = v_craftsman_user_id AND twr.is_revealed = TRUE AND twr.customer_rating IS NOT NULL;

            UPDATE craft_profiles
            SET average_rating = COALESCE(v_new_avg, 5.00),
                total_reviews_count = v_total_reviews,
                badge = CASE WHEN v_new_avg >= 4.80 AND v_total_reviews >= 30 THEN 'Top Rated Pro'
                             WHEN v_new_avg >= 4.50 THEN 'Master Handyman'
                             ELSE 'Verified Craftsman' END,
                updated_at = timezone('utc'::text, now())
            WHERE user_id = v_craftsman_user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_two_way_reviews ON two_way_reviews;
CREATE TRIGGER trg_after_insert_two_way_reviews
BEFORE INSERT OR UPDATE ON two_way_reviews
FOR EACH ROW EXECUTE FUNCTION trg_check_and_reveal_reviews();

-- FUNCTION 4: AUTOMATIC REVEAL FOR EXPIRED UNILATERAL REVIEWS (48 HOURS CRON)
CREATE OR REPLACE FUNCTION reveal_expired_unilateral_reviews()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    UPDATE two_way_reviews
    SET is_revealed = TRUE,
        revealed_at = timezone('utc'::text, now())
    WHERE is_revealed = FALSE AND auto_reveal_deadline <= timezone('utc'::text, now());
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
