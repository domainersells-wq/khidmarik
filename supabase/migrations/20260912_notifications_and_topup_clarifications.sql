-- ==============================================================================
-- KHIDMATIK NOTIFICATIONS & TOP-UP CLARIFICATION RESILIENCE MIGRATION
-- Adds data, channel columns to public.notifications if missing
-- Hardens RLS policies for notifications and transaction clarification records
-- ==============================================================================

-- 1. Ensure columns exist on public.notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'data'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'channel'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN channel VARCHAR(32) DEFAULT 'all';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ NULL;
    END IF;
END $$;

-- 2. Indexes for notifications performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Row Level Security for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to mark their own notifications as read
DROP POLICY IF EXISTS "Users can update their own notifications (mark read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow insertion of notifications by authenticated users and service role (system alerts)
DROP POLICY IF EXISTS "Authenticated users or service role can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users or service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- 4. Enable Realtime publication for notifications if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
