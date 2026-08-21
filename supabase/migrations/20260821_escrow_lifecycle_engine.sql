-- ==============================================================================
-- KHIDMATIK ESCROW LIFECYCLE & AUTOMATION ENGINE MIGRATION
-- Multi-Vendor Super App Financial Vault & Dispute Resolution Engine
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL UNIQUE,
    order_type VARCHAR(30) DEFAULT 'service' NOT NULL, -- 'service' | 'ecommerce' | 'digital'
    payer_id UUID NOT NULL,
    payee_id UUID NOT NULL,
    
    -- Financial breakdown in Algerian Dinar (DZD)
    total_amount_da NUMERIC(12, 2) NOT NULL,
    platform_commission_rate NUMERIC(4, 3) DEFAULT 0.050 NOT NULL,
    platform_fee_da NUMERIC(12, 2) NOT NULL,
    payee_net_da NUMERIC(12, 2) NOT NULL,
    spare_parts_amount_da NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    
    -- State Machine
    -- 'HELD' -> 'DELIVERED' -> 'RELEASED'
    -- 'HELD' | 'DELIVERED' -> 'DISPUTED' -> 'REFUNDED' | 'PARTIALLY_RELEASED' | 'RELEASED'
    status VARCHAR(30) DEFAULT 'HELD' NOT NULL,
    
    -- Protection Timers
    protection_duration_hours INT DEFAULT 48 NOT NULL, -- 48h for services, 120h (5 days) for ecommerce
    held_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    protection_ends_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    
    -- Dispute & Arbitration
    dispute_reason TEXT,
    dispute_evidence_urls TEXT[],
    disputed_at TIMESTAMP WITH TIME ZONE,
    resolution_type VARCHAR(30), -- 'FULL_REFUND' | 'PARTIAL_SETTLEMENT' | 'RELEASE_TO_VENDOR'
    refunded_to_buyer_da NUMERIC(12, 2) DEFAULT 0.00,
    paid_to_vendor_da NUMERIC(12, 2) DEFAULT 0.00,
    admin_notes TEXT,
    resolved_by_admin_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for high performance lookup
CREATE INDEX IF NOT EXISTS idx_escrow_order_id ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_protection_ends ON escrow_transactions(protection_ends_at) WHERE status = 'DELIVERED';

-- ==============================================================================
-- STORED PROCEDURES (ATOMIC CONCURRENCY WITH ROW LOCKING)
-- ==============================================================================

-- 1. HOLD ESCROW (CREATION & VAULT LOCK)
CREATE OR REPLACE FUNCTION hold_escrow_funds(
    p_order_id VARCHAR(50),
    p_order_type VARCHAR(30),
    p_payer_id UUID,
    p_payee_id UUID,
    p_total_amount_da NUMERIC(12, 2),
    p_spare_parts_da NUMERIC(12, 2),
    p_protection_hours INT,
    p_commission_rate NUMERIC(4, 3)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_platform_fee NUMERIC(12, 2);
    v_payee_net NUMERIC(12, 2);
    v_escrow_id UUID;
BEGIN
    -- Calculate fees (Zero commission on spare parts)
    v_platform_fee := ROUND((p_total_amount_da - p_spare_parts_da) * p_commission_rate, 2);
    v_payee_net := p_total_amount_da - v_platform_fee;

    -- Insert Escrow Record in HELD state
    INSERT INTO escrow_transactions (
        order_id,
        order_type,
        payer_id,
        payee_id,
        total_amount_da,
        platform_commission_rate,
        platform_fee_da,
        payee_net_da,
        spare_parts_amount_da,
        status,
        protection_duration_hours,
        held_at
    ) VALUES (
        p_order_id,
        p_order_type,
        p_payer_id,
        p_payee_id,
        p_total_amount_da,
        p_commission_rate,
        v_platform_fee,
        v_payee_net,
        p_spare_parts_da,
        'HELD',
        p_protection_hours,
        timezone('utc'::text, now())
    ) RETURNING id INTO v_escrow_id;

    -- Update Wallets: Increase buyer locked escrow
    UPDATE wallets
    SET locked_escrow_da = locked_escrow_da + p_total_amount_da,
        updated_at = timezone('utc'::text, now())
    WHERE owner_id = p_payer_id;

    RETURN jsonb_build_object(
        'success', true,
        'escrowId', v_escrow_id,
        'orderId', p_order_id,
        'status', 'HELD',
        'totalLockedDA', p_total_amount_da,
        'payeeNetDA', v_payee_net,
        'platformFeeDA', v_platform_fee
    );
END;
$$;

-- 2. CONFIRM DELIVERY & START PROTECTION COUNTDOWN
CREATE OR REPLACE FUNCTION confirm_escrow_delivery(
    p_order_id VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow RECORD;
    v_ends_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT * INTO v_escrow FROM escrow_transactions WHERE order_id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ESCROW_RECORD_NOT_FOUND');
    END IF;

    IF v_escrow.status != 'HELD' THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATE_TRANSITION', 'currentStatus', v_escrow.status);
    END IF;

    v_ends_at := timezone('utc'::text, now()) + (v_escrow.protection_duration_hours || ' hours')::INTERVAL;

    UPDATE escrow_transactions
    SET status = 'DELIVERED',
        delivered_at = timezone('utc'::text, now()),
        protection_ends_at = v_ends_at,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'orderId', p_order_id,
        'status', 'DELIVERED',
        'deliveredAt', timezone('utc'::text, now()),
        'protectionEndsAt', v_ends_at,
        'autoReleaseInHours', v_escrow.protection_duration_hours
    );
END;
$$;

-- 3. INSTANT EARLY RELEASE (BUYER APPROVED)
CREATE OR REPLACE FUNCTION release_escrow_settlement(
    p_order_id VARCHAR(50),
    p_caller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow RECORD;
    v_payee_wallet_id UUID;
    v_payer_wallet_id UUID;
    v_ledger_ref VARCHAR(100);
BEGIN
    SELECT * INTO v_escrow FROM escrow_transactions WHERE order_id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ESCROW_RECORD_NOT_FOUND');
    END IF;

    IF v_escrow.status NOT IN ('HELD', 'DELIVERED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_ESCROW_STATUS', 'currentStatus', v_escrow.status);
    END IF;

    -- Update Escrow state to RELEASED
    UPDATE escrow_transactions
    SET status = 'RELEASED',
        paid_to_vendor_da = v_escrow.payee_net_da,
        released_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id;

    -- Fetch wallets
    SELECT id INTO v_payee_wallet_id FROM wallets WHERE owner_id = v_escrow.payee_id LIMIT 1;
    SELECT id INTO v_payer_wallet_id FROM wallets WHERE owner_id = v_escrow.payer_id LIMIT 1;

    -- Credit Payee / Vendor wallet with net earnings
    IF v_payee_wallet_id IS NOT NULL THEN
        UPDATE wallets
        SET balance_da = balance_da + v_escrow.payee_net_da,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_payee_wallet_id;
    END IF;

    -- Deduct locked escrow from Buyer
    IF v_payer_wallet_id IS NOT NULL THEN
        UPDATE wallets
        SET locked_escrow_da = GREATEST(0.00, locked_escrow_da - v_escrow.total_amount_da),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_payer_wallet_id;
    END IF;

    -- Create immutable ledger entry
    v_ledger_ref := 'LEDGER-ESCROW-' || p_order_id || '-' || floor(random()*899999+100000)::text;
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
        v_payer_wallet_id,
        v_payee_wallet_id,
        v_escrow.payee_net_da,
        v_escrow.platform_fee_da,
        v_ledger_ref,
        'Escrow released for order ' || p_order_id || ' (Net Payout to Vendor)'
    );

    RETURN jsonb_build_object(
        'success', true,
        'orderId', p_order_id,
        'status', 'RELEASED',
        'payoutDA', v_escrow.payee_net_da,
        'platformFeeDA', v_escrow.platform_fee_da,
        'ledgerReference', v_ledger_ref
    );
END;
$$;

-- 4. OPEN DISPUTE (BUYER FREEZES COUNTDOWN)
CREATE OR REPLACE FUNCTION open_escrow_dispute(
    p_order_id VARCHAR(50),
    p_reason TEXT,
    p_evidence_urls TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow RECORD;
BEGIN
    SELECT * INTO v_escrow FROM escrow_transactions WHERE order_id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ESCROW_RECORD_NOT_FOUND');
    END IF;

    IF v_escrow.status NOT IN ('HELD', 'DELIVERED') THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_DISPUTE_NON_ACTIVE_ESCROW');
    END IF;

    -- Freeze escrow and set to DISPUTED
    UPDATE escrow_transactions
    SET status = 'DISPUTED',
        dispute_reason = p_reason,
        dispute_evidence_urls = p_evidence_urls,
        disputed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE order_id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'orderId', p_order_id,
        'status', 'DISPUTED',
        'disputeReason', p_reason,
        'message', 'Escrow funds frozen. Dispute ticket escalated to Super Admin Arbitration Center.'
    );
END;
$$;

-- 5. ADMIN DISPUTE RESOLUTION (SUPER ADMIN DECISION)
CREATE OR REPLACE FUNCTION admin_resolve_escrow_dispute(
    p_escrow_id UUID,
    p_resolution_type VARCHAR(30), -- 'FULL_REFUND' | 'PARTIAL_SETTLEMENT' | 'RELEASE_TO_VENDOR'
    p_vendor_amount_da NUMERIC(12, 2),
    p_refund_amount_da NUMERIC(12, 2),
    p_admin_notes TEXT,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_escrow RECORD;
    v_payee_wallet_id UUID;
    v_payer_wallet_id UUID;
    v_next_status VARCHAR(30);
BEGIN
    SELECT * INTO v_escrow FROM escrow_transactions WHERE id = p_escrow_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ESCROW_RECORD_NOT_FOUND');
    END IF;

    IF v_escrow.status != 'DISPUTED' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ESCROW_NOT_IN_DISPUTE');
    END IF;

    SELECT id INTO v_payee_wallet_id FROM wallets WHERE owner_id = v_escrow.payee_id LIMIT 1;
    SELECT id INTO v_payer_wallet_id FROM wallets WHERE owner_id = v_escrow.payer_id LIMIT 1;

    IF p_resolution_type = 'FULL_REFUND' THEN
        v_next_status := 'REFUNDED';
        -- Refund buyer
        IF v_payer_wallet_id IS NOT NULL THEN
            UPDATE wallets
            SET balance_da = balance_da + v_escrow.total_amount_da,
                locked_escrow_da = GREATEST(0.00, locked_escrow_da - v_escrow.total_amount_da),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payer_wallet_id;
        END IF;

    ELSIF p_resolution_type = 'PARTIAL_SETTLEMENT' THEN
        v_next_status := 'PARTIALLY_RELEASED';
        -- Refund partial to buyer, release rest to vendor
        IF v_payer_wallet_id IS NOT NULL THEN
            UPDATE wallets
            SET balance_da = balance_da + p_refund_amount_da,
                locked_escrow_da = GREATEST(0.00, locked_escrow_da - v_escrow.total_amount_da),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payer_wallet_id;
        END IF;

        IF v_payee_wallet_id IS NOT NULL THEN
            UPDATE wallets
            SET balance_da = balance_da + p_vendor_amount_da,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payee_wallet_id;
        END IF;

    ELSE -- 'RELEASE_TO_VENDOR'
        v_next_status := 'RELEASED';
        IF v_payee_wallet_id IS NOT NULL THEN
            UPDATE wallets
            SET balance_da = balance_da + v_escrow.payee_net_da,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payee_wallet_id;
        END IF;

        IF v_payer_wallet_id IS NOT NULL THEN
            UPDATE wallets
            SET locked_escrow_da = GREATEST(0.00, locked_escrow_da - v_escrow.total_amount_da),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payer_wallet_id;
        END IF;
    END IF;

    -- Update Escrow Transaction
    UPDATE escrow_transactions
    SET status = v_next_status,
        resolution_type = p_resolution_type,
        paid_to_vendor_da = p_vendor_amount_da,
        refunded_to_buyer_da = p_refund_amount_da,
        admin_notes = p_admin_notes,
        resolved_by_admin_id = p_admin_id,
        resolved_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_escrow_id;

    -- Record Audit Ledger
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
        v_escrow.order_id,
        'DISPUTE_ARBITRATION_' || p_resolution_type,
        v_payer_wallet_id,
        v_payee_wallet_id,
        p_vendor_amount_da,
        0.00,
        'LEDGER-DISPUTE-' || v_escrow.order_id || '-' || floor(random()*899999+100000)::text,
        'Arbitration resolution (' || p_resolution_type || '): ' || p_admin_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'escrowId', p_escrow_id,
        'status', v_next_status,
        'resolutionType', p_resolution_type,
        'vendorPayoutDA', p_vendor_amount_da,
        'buyerRefundDA', p_refund_amount_da
    );
END;
$$;

-- 6. AUTO RELEASE EXPIRED ESCROW (SCHEDULED CRON JOB)
CREATE OR REPLACE FUNCTION auto_release_expired_escrows()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_order RECORD;
    v_count INT := 0;
BEGIN
    FOR v_order IN 
        SELECT order_id, payer_id 
        FROM escrow_transactions 
        WHERE status = 'DELIVERED' 
          AND protection_ends_at <= timezone('utc'::text, now())
    LOOP
        PERFORM release_escrow_settlement(v_order.order_id, v_order.payer_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
