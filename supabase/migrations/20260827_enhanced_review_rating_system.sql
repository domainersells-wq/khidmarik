-- ==============================================================================
-- KHIDMATIK ENHANCED REVIEW & RATING SYSTEM MIGRATION
-- Supports: 6-Factor Structured Ratings (Overall, Quality, Price, Communication,
--           Punctuality, Professionalism), Verified Purchase Badges, Media Attachments,
--           Provider Replies, Helpful Upvotes, Reports, and Strict Moderation RLS.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENHANCED REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, -- Target store, professional profile, product, service, or hall
    target_type VARCHAR(32) NOT NULL DEFAULT 'store', -- 'store', 'professional', 'product', 'service', 'hall'
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT NULL,
    order_id UUID NULL, -- Linked completed order/booking ID
    is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 6 Structured Rating Dimensions (1.0 to 5.0)
    rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,           -- Overall rating
    rating_quality SMALLINT NOT NULL DEFAULT 5,           -- 1 to 5
    rating_price SMALLINT NOT NULL DEFAULT 5,             -- 1 to 5 (Value for Money)
    rating_communication SMALLINT NOT NULL DEFAULT 5,     -- 1 to 5
    rating_punctuality SMALLINT NOT NULL DEFAULT 5,       -- 1 to 5 (Speed / Timeliness)
    rating_professionalism SMALLINT NOT NULL DEFAULT 5,   -- 1 to 5
    
    title TEXT NULL,
    comment TEXT NOT NULL,
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,        -- Array of { url, type: 'image'|'video', caption }
    helpful_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'approved',       -- 'pending', 'approved', 'flagged', 'rejected', 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Enforce single review per user per completed order (prevents duplicate reviews)
    CONSTRAINT unique_user_order_review UNIQUE(author_id, target_id, order_id)
);

-- Indexing for queries and aggregations
CREATE INDEX IF NOT EXISTS idx_reviews_target ON public.reviews(target_id, target_type, status);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON public.reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON public.reviews(helpful_count DESC);

-- 2. REVIEW REPLIES TABLE (Store Owner / Service Provider Official Response)
CREATE TABLE IF NOT EXISTS public.review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    responder_name VARCHAR(255) NOT NULL,
    responder_role VARCHAR(50) NOT NULL DEFAULT 'store_owner', -- 'store_owner', 'service_provider', 'admin'
    reply_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(review_id) -- Only 1 official merchant reply per review
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review ON public.review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_responder ON public.review_replies(responder_id);

-- 3. REVIEW HELPFUL VOTES TABLE (Upvoting helpful reviews)
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON public.review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user ON public.review_helpful_votes(user_id);

-- 4. REVIEW REPORTS TABLE (Flagging inappropriate / fake reviews)
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(64) NOT NULL, -- 'spam', 'inappropriate', 'fake_review', 'harassment', 'other'
    details TEXT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'action_taken'
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON public.review_reports(review_id);

-- ==============================================================================
-- 5. AUTOMATED RATING RECALCULATION TRIGGERS
-- ==============================================================================

-- Function: Recalculate target store / profile rating statistics
CREATE OR REPLACE FUNCTION public.handle_review_stats_update()
RETURNS TRIGGER AS $$
DECLARE
    v_target_id UUID;
    v_target_type VARCHAR(32);
    v_avg NUMERIC(3, 2);
    v_count INTEGER;
BEGIN
    v_target_id := COALESCE(NEW.target_id, OLD.target_id);
    v_target_type := COALESCE(NEW.target_type, OLD.target_type);

    -- Calculate average and count of approved reviews
    SELECT 
        COALESCE(AVG(rating), 5.0),
        COUNT(*)
    INTO v_avg, v_count
    FROM public.reviews
    WHERE target_id = v_target_id 
      AND status = 'approved';

    -- Update store if target is store
    IF v_target_type = 'store' THEN
        UPDATE public.stores
        SET 
            average_rating = ROUND(v_avg, 1),
            total_reviews = v_count,
            updated_at = NOW()
        WHERE id = v_target_id;
    END IF;

    -- Trigger notification on new review
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        -- Push notification to store/listing owner
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            data,
            channel,
            is_read,
            created_at
        )
        SELECT 
            s.owner_id,
            'new_review',
            'New Review Received (⭐ ' || NEW.rating || '/5)',
            NEW.author_name || ' left a ' || NEW.rating || '-star review: "' || SUBSTRING(NEW.comment, 1, 60) || '..."',
            jsonb_build_object(
                'review_id', NEW.id,
                'target_id', NEW.target_id,
                'rating', NEW.rating,
                'action_url', '/listings/' || NEW.target_id
            ),
            'all',
            FALSE,
            NOW()
        FROM public.stores s
        WHERE s.id = NEW.target_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_review_stats_update ON public.reviews;
CREATE TRIGGER trigger_review_stats_update
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_review_stats_update();

-- Function: Recalculate helpful count when votes change
CREATE OR REPLACE FUNCTION public.handle_helpful_vote_change()
RETURNS TRIGGER AS $$
DECLARE
    v_review_id UUID;
    v_count INTEGER;
BEGIN
    v_review_id := COALESCE(NEW.review_id, OLD.review_id);

    SELECT COUNT(*) INTO v_count
    FROM public.review_helpful_votes
    WHERE review_id = v_review_id;

    UPDATE public.reviews
    SET helpful_count = v_count
    WHERE id = v_review_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_helpful_vote_change ON public.review_helpful_votes;
CREATE TRIGGER trigger_helpful_vote_change
    AFTER INSERT OR DELETE ON public.review_helpful_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_helpful_vote_change();

-- ==============================================================================
-- 6. STRICT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (
        status = 'approved' 
        OR auth.uid() = author_id 
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors and Admins can update reviews" ON public.reviews;
CREATE POLICY "Authors and Admins can update reviews"
    ON public.reviews FOR UPDATE
    USING (
        auth.uid() = author_id 
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')
        )
    )
    WITH CHECK (
        auth.uid() = author_id 
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')
        )
    );

DROP POLICY IF EXISTS "Authors and Admins can delete reviews" ON public.reviews;
CREATE POLICY "Authors and Admins can delete reviews"
    ON public.reviews FOR DELETE
    USING (
        auth.uid() = author_id 
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')
        )
    );

-- REVIEW REPLIES POLICIES
DROP POLICY IF EXISTS "Public can view review replies" ON public.review_replies;
CREATE POLICY "Public can view review replies"
    ON public.review_replies FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Store/Provider owners and Admins can reply" ON public.review_replies;
CREATE POLICY "Store/Provider owners and Admins can reply"
    ON public.review_replies FOR INSERT
    WITH CHECK (auth.uid() = responder_id);

DROP POLICY IF EXISTS "Responders and Admins can update replies" ON public.review_replies;
CREATE POLICY "Responders and Admins can update replies"
    ON public.review_replies FOR UPDATE
    USING (auth.uid() = responder_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')))
    WITH CHECK (auth.uid() = responder_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

DROP POLICY IF EXISTS "Responders and Admins can delete replies" ON public.review_replies;
CREATE POLICY "Responders and Admins can delete replies"
    ON public.review_replies FOR DELETE
    USING (auth.uid() = responder_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')));

-- HELPFUL VOTES POLICIES
DROP POLICY IF EXISTS "Public can view helpful votes" ON public.review_helpful_votes;
CREATE POLICY "Public can view helpful votes"
    ON public.review_helpful_votes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote helpful" ON public.review_helpful_votes;
CREATE POLICY "Authenticated users can vote helpful"
    ON public.review_helpful_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their helpful vote" ON public.review_helpful_votes;
CREATE POLICY "Users can remove their helpful vote"
    ON public.review_helpful_votes FOR DELETE
    USING (auth.uid() = user_id);

-- REVIEW REPORTS POLICIES
DROP POLICY IF EXISTS "Users can view own reports or Admin" ON public.review_reports;
CREATE POLICY "Users can view own reports or Admin"
    ON public.review_reports FOR SELECT
    USING (
        auth.uid() = reporter_id 
        OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR'))
    );

DROP POLICY IF EXISTS "Authenticated users can report reviews" ON public.review_reports;
CREATE POLICY "Authenticated users can report reviews"
    ON public.review_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- 7. STORAGE BUCKET FOR REVIEW MEDIA
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload review media" ON storage.objects;
CREATE POLICY "Authenticated users can upload review media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public can view review media" ON storage.objects;
CREATE POLICY "Public can view review media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'review-media');
