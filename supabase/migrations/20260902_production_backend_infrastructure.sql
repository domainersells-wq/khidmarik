-- ================================================================================================
-- KHIDMATIK PRODUCTION BACKEND INFRASTRUCTURE SCHEMA
-- Migration: 20260902_production_backend_infrastructure.sql
-- Description: Creates foundational tables for Idempotency, Transactional Outbox, Financial Ledger,
--              Webhook deduplication, and High-performance indexing.
-- ================================================================================================

-- 1. Idempotency Keys Storage
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    fingerprint VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSING', -- 'PROCESSING', 'COMPLETED', 'FAILED'
    response_status INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);

-- 2. Transactional Outbox Pattern
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED'
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.outbox_events(status, created_at)
WHERE status IN ('PENDING', 'FAILED');

-- 3. Immutable Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS public.financial_double_entry_ledger (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64),
    wallet_id VARCHAR(64),
    account_type VARCHAR(64) NOT NULL, -- 'ESCROW_HOLD', 'PLATFORM_COMMISSION', 'SELLER_PAYOUT', 'REFUND_POOL', 'CUSTOMER_WALLET'
    entry_type VARCHAR(16) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'DZD',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tx ON public.financial_double_entry_ledger(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.financial_double_entry_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON public.financial_double_entry_ledger(wallet_id);

-- 4. Webhook Event Deduplication
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id VARCHAR(128) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL, -- 'edahabia', 'baridimob', 'stripe', 'yalidine'
    event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(128),
    payload JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSED',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON public.webhook_events(provider, event_id);

-- 5. Distributed Audit Logs
CREATE TABLE IF NOT EXISTS public.distributed_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    correlation_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.distributed_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.distributed_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON public.distributed_audit_logs(correlation_id);
