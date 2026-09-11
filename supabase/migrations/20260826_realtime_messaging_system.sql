-- ==============================================================================
-- KHIDMATIK REAL-TIME MESSAGING SYSTEM MIGRATION
-- Supports: Customer ↔ Store Owner, Customer ↔ Service Provider, Customer ↔ Support
-- Features: Conversations, Messages, Read status, Unread count, Real-time channels,
--           Presence, Typing indicator, Attachments, Timestamps, Soft-delete,
--           User Reporting, User Blocking, Conversation search, and Strict RLS.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(32) NOT NULL DEFAULT 'direct', -- 'customer_store', 'customer_provider', 'customer_support', 'direct'
    title TEXT NULL,
    context_type VARCHAR(64) DEFAULT 'general', -- 'store', 'provider', 'order', 'booking', 'dispute', 'support_ticket', 'general'
    context_id TEXT NULL,                       -- e.g. store_id, service_id, order_id, ticket_id
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_message_text TEXT NULL,
    last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing for conversation lookups & ordering
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_context ON public.conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'participant', -- 'customer', 'store_owner', 'service_provider', 'support_agent', 'admin', 'participant'
    last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    unread_count INTEGER NOT NULL DEFAULT 0,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_starred BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    left_at TIMESTAMPTZ NULL,
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv_user ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_participants_unread ON public.conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    message_type VARCHAR(32) NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'system', 'quote_request', 'location'
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Array of { url, name, size, type, file_type: 'image'|'file' }
    status VARCHAR(20) NOT NULL DEFAULT 'sent',       -- 'sending', 'sent', 'delivered', 'read'
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_id);

-- 4. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- 5. USER REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    reason VARCHAR(64) NOT NULL, -- 'spam', 'harassment', 'fraud', 'inappropriate_content', 'other'
    description TEXT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON public.user_reports(reported_user_id);

-- 6. USER PRESENCE TABLE (Tracks online/offline and last active timestamp)
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status_message TEXT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_presence_online ON public.user_presence(is_online, last_seen_at DESC);

-- ==============================================================================
-- 7. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Trigger: When a message is inserted, update conversation last_message stats and increment unread counts
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient RECORD;
    v_sender_name TEXT := 'A user';
    v_snippet TEXT;
BEGIN
    -- 1. Update conversation last message data
    v_snippet := CASE 
        WHEN NEW.is_deleted THEN 'Message deleted'
        WHEN NEW.message_type = 'image' THEN '📷 [Image attachment]'
        WHEN NEW.message_type = 'file' THEN '📎 [File attachment]'
        WHEN LENGTH(NEW.content) > 100 THEN SUBSTRING(NEW.content, 1, 97) || '...'
        ELSE NEW.content
    END;

    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_text = v_snippet,
        last_message_sender_id = NEW.sender_id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- 2. Increment unread_count for all other active participants
    UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id;

    -- 3. Fetch sender name for notification
    SELECT name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    IF v_sender_name IS NULL THEN
        v_sender_name := 'Someone';
    END IF;

    -- 4. Push in-app notification to all recipients in the conversation
    FOR v_recipient IN 
        SELECT cp.user_id 
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = NEW.conversation_id 
          AND cp.user_id != NEW.sender_id
          AND cp.is_muted = FALSE
    LOOP
        -- Check if notifications table exists and insert
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                data,
                channel,
                is_read,
                created_at
            ) VALUES (
                v_recipient.user_id,
                'new_message',
                'New message from ' || v_sender_name,
                v_snippet,
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'sender_id', NEW.sender_id,
                    'action_url', '/messages?id=' || NEW.conversation_id::text
                ),
                'all',
                FALSE,
                NOW()
            );
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_new_message ON public.messages;
CREATE TRIGGER trigger_handle_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- Trigger: When last_read_at is updated, reset unread_count
CREATE OR REPLACE FUNCTION public.handle_participant_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_read_at > OLD.last_read_at THEN
        NEW.unread_count := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_handle_participant_read ON public.conversation_participants;
CREATE TRIGGER trigger_handle_participant_read
    BEFORE UPDATE ON public.conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_participant_read();

-- Atomic Function: Get or Create 1-to-1 conversation between current user and target
CREATE OR REPLACE FUNCTION public.create_or_get_direct_conversation(
    p_target_user_id UUID,
    p_type VARCHAR(32) DEFAULT 'direct',
    p_context_type VARCHAR(64) DEFAULT 'general',
    p_context_id TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_target_role VARCHAR(32) DEFAULT 'participant'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_conv_id UUID;
    v_is_blocked BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_user_id = p_target_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;

    -- Check if either party blocked the other
    SELECT EXISTS (
        SELECT 1 FROM public.user_blocks
        WHERE (blocker_id = v_user_id AND blocked_id = p_target_user_id)
           OR (blocker_id = p_target_user_id AND blocked_id = v_user_id)
    ) INTO v_is_blocked;

    IF v_is_blocked THEN
        RAISE EXCEPTION 'Cannot start conversation with blocked user';
    END IF;

    -- Check for existing 1-to-1 conversation with matching context (if provided) or direct
    SELECT c.id INTO v_conv_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_user_id
    JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_target_user_id
    WHERE (
        (p_context_id IS NOT NULL AND c.context_id = p_context_id AND c.context_type = p_context_type)
        OR (p_context_id IS NULL AND c.type = p_type)
    )
    LIMIT 1;

    -- If found, return existing conversation id
    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    -- Otherwise, create new conversation
    INSERT INTO public.conversations (
        type,
        title,
        context_type,
        context_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_type,
        p_title,
        p_context_type,
        p_context_id,
        v_user_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_conv_id;

    -- Add current user as participant
    INSERT INTO public.conversation_participants (
        conversation_id,
        user_id,
        role,
        last_read_at,
        unread_count,
        joined_at
    ) VALUES (
        v_conv_id,
        v_user_id,
        'customer',
        NOW(),
        0,
        NOW()
    );

    -- Add target user as participant
    INSERT INTO public.conversation_participants (
        conversation_id,
        user_id,
        role,
        last_read_at,
        unread_count,
        joined_at
    ) VALUES (
        v_conv_id,
        p_target_user_id,
        COALESCE(p_target_role, 'participant'),
        NOW(),
        0,
        NOW()
    );

    RETURN v_conv_id;
END;
$$;

-- ==============================================================================
-- 8. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Helper check function for participant or support/admin
CREATE OR REPLACE FUNCTION public.can_access_conversation(p_conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = p_conv_id AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND upper(role) IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
    );
$$;

-- CONVERSATIONS RLS
DROP POLICY IF EXISTS "Participants and Support can view conversations" ON public.conversations;
CREATE POLICY "Participants and Support can view conversations"
    ON public.conversations FOR SELECT
    USING (public.can_access_conversation(id));

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Participants and Admins can update conversations" ON public.conversations;
CREATE POLICY "Participants and Admins can update conversations"
    ON public.conversations FOR UPDATE
    USING (public.can_access_conversation(id))
    WITH CHECK (public.can_access_conversation(id));

-- CONVERSATION PARTICIPANTS RLS
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
    ON public.conversation_participants FOR SELECT
    USING (public.can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Authenticated users can insert participants" ON public.conversation_participants;
CREATE POLICY "Authenticated users can insert participants"
    ON public.conversation_participants FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own participant record or admin" ON public.conversation_participants;
CREATE POLICY "Users can update own participant record or admin"
    ON public.conversation_participants FOR UPDATE
    USING (auth.uid() = user_id OR public.can_access_conversation(conversation_id))
    WITH CHECK (auth.uid() = user_id OR public.can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Users can leave conversation or admin" ON public.conversation_participants;
CREATE POLICY "Users can leave conversation or admin"
    ON public.conversation_participants FOR DELETE
    USING (auth.uid() = user_id);

-- MESSAGES RLS
DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.messages;
CREATE POLICY "Participants can view conversation messages"
    ON public.messages FOR SELECT
    USING (public.can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "Active participants can insert messages" ON public.messages;
CREATE POLICY "Active participants can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id 
        AND public.can_access_conversation(conversation_id)
        AND NOT EXISTS (
            SELECT 1 FROM public.user_blocks ub
            JOIN public.conversation_participants cp ON cp.user_id = ub.blocker_id
            WHERE cp.conversation_id = conversation_id AND ub.blocked_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Senders can soft-delete or update messages" ON public.messages;
CREATE POLICY "Senders can soft-delete or update messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = sender_id OR public.can_access_conversation(conversation_id))
    WITH CHECK (auth.uid() = sender_id OR public.can_access_conversation(conversation_id));

-- USER BLOCKS RLS
DROP POLICY IF EXISTS "Users can view their blocks" ON public.user_blocks;
CREATE POLICY "Users can view their blocks"
    ON public.user_blocks FOR SELECT
    USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create blocks" ON public.user_blocks;
CREATE POLICY "Users can create blocks"
    ON public.user_blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their blocks" ON public.user_blocks;
CREATE POLICY "Users can delete their blocks"
    ON public.user_blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- USER REPORTS RLS
DROP POLICY IF EXISTS "Users can view reports they filed or admin" ON public.user_reports;
CREATE POLICY "Users can view reports they filed or admin"
    ON public.user_reports FOR SELECT
    USING (
        auth.uid() = reporter_id 
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT')
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND upper(role) IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT')
        )
    );

DROP POLICY IF EXISTS "Users can submit reports" ON public.user_reports;
CREATE POLICY "Users can submit reports"
    ON public.user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- USER PRESENCE RLS
DROP POLICY IF EXISTS "Authenticated users can view presence" ON public.user_presence;
CREATE POLICY "Authenticated users can view presence"
    ON public.user_presence FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage own presence" ON public.user_presence;
CREATE POLICY "Users can manage own presence"
    ON public.user_presence FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 9. ENABLE SUPABASE REALTIME PUBLICATION
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 10. STORAGE BUCKET CONFIGURATION (chat-attachments)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view chat attachments" ON storage.objects;
CREATE POLICY "Users can view chat attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'chat-attachments');
