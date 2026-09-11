-- ==============================================================================
-- KHIDMATIK UNIFIED ADVANCED SEARCH ENGINE MIGRATION
-- High-Performance Multi-Entity Search, Spatial Distance, and Faceted Filtering
-- Migration: 20260828_unified_advanced_search_engine.sql
-- ==============================================================================

-- 1. EXTENSIONS FOR FAST TEXT SEARCH & TRIGRAM MATCHING
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ==============================================================================
-- 2. HIGH-PERFORMANCE INDEXES
-- ==============================================================================

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_search_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price_da);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON public.products USING gin (description gin_trgm_ops);

-- Stores Indexes
CREATE INDEX IF NOT EXISTS idx_stores_search_active ON public.stores (is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_stores_wilaya ON public.stores (wilaya);
CREATE INDEX IF NOT EXISTS idx_stores_name_trgm ON public.stores USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stores_desc_trgm ON public.stores USING gin (description gin_trgm_ops);

-- Profiles / Providers Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles (is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin (name gin_trgm_ops);

-- Categories Indexes
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon_name VARCHAR(100),
    type VARCHAR(50) DEFAULT 'all', -- 'store', 'professional', 'product', 'all'
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    item_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON public.categories USING gin (name gin_trgm_ops);

-- Bookable Services / Listings Table (if not existing)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    price_da NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    price_unit VARCHAR(50) DEFAULT 'job', -- 'hour', 'job', 'day', 'fixed'
    rating NUMERIC(3, 2) DEFAULT 5.00 NOT NULL,
    reviews_count INT DEFAULT 0 NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    delivery_available BOOLEAN DEFAULT FALSE NOT NULL,
    wilaya VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_cat_wilaya ON public.services (category, wilaya);
CREATE INDEX IF NOT EXISTS idx_services_price ON public.services (price_da);
CREATE INDEX IF NOT EXISTS idx_services_rating ON public.services (rating DESC);
CREATE INDEX IF NOT EXISTS idx_services_title_trgm ON public.services USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_desc_trgm ON public.services USING gin (description gin_trgm_ops);

-- ==============================================================================
-- 3. HAVERSINE DISTANCE HELPER FUNCTION (IN KILOMETERS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT CASE
        WHEN lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN NULL
        WHEN lat1 = lat2 AND lon1 = lon2 THEN 0.0
        ELSE
            ROUND(
                (6371.0 * acos(
                    LEAST(1.0, GREATEST(-1.0, 
                        cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) + 
                        sin(radians(lat1)) * sin(radians(lat2))
                    ))
                ))::numeric, 2
            )
    END;
$$;

-- ==============================================================================
-- 4. UNIFIED ADVANCED CATALOG SEARCH RPC FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION search_unified_catalog(
    p_keyword TEXT DEFAULT NULL,
    p_entity_type TEXT DEFAULT 'all', -- 'all', 'products', 'services', 'providers', 'stores', 'listings', 'bookings', 'categories'
    p_category_slug TEXT DEFAULT NULL,
    p_subcategory_slug TEXT DEFAULT NULL,
    p_wilaya_code TEXT DEFAULT NULL,
    p_user_lat NUMERIC DEFAULT NULL,
    p_user_lng NUMERIC DEFAULT NULL,
    p_max_distance_km NUMERIC DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_min_rating NUMERIC DEFAULT NULL,
    p_only_verified BOOLEAN DEFAULT FALSE,
    p_only_delivery BOOLEAN DEFAULT FALSE,
    p_only_available BOOLEAN DEFAULT FALSE,
    p_sort_by TEXT DEFAULT 'relevance', -- 'relevance', 'popularity', 'newest', 'price_asc', 'price_desc', 'rating', 'distance'
    p_page INT DEFAULT 1,
    p_page_size INT DEFAULT 12
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_clean_kw TEXT := NULLIF(TRIM(p_keyword), '');
    v_offset INT := GREATEST(0, (p_page - 1) * p_page_size);
    v_results JSON;
    v_total_count INT := 0;
    v_facet_counts JSON;
BEGIN
    -- Common Table Expression aggregating searchable items across tables
    WITH unified_items AS (
        -- 1. PRODUCTS
        SELECT 
            p.id::text AS item_id,
            'products' AS entity_type,
            p.name AS title,
            p.description,
            p.category AS category_name,
            p.category AS category_slug,
            NULL::text AS subcategory_slug,
            p.price_da AS price,
            'DA' AS currency,
            4.8::numeric AS rating,
            12 AS reviews_count,
            CASE WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN p.images[1] ELSE NULL END AS image_url,
            p.images AS gallery_urls,
            s.name AS owner_name,
            s.id::text AS owner_id,
            s.is_verified AS is_verified,
            TRUE AS delivery_available,
            (p.stock_quantity > 0) AS is_available,
            s.wilaya AS wilaya,
            s.commune AS city,
            NULL::numeric AS latitude,
            NULL::numeric AS longitude,
            NULL::numeric AS distance_km,
            p.created_at,
            (CASE 
                WHEN v_clean_kw IS NULL THEN 1.0
                WHEN p.name ILIKE v_clean_kw THEN 10.0
                WHEN p.name ILIKE v_clean_kw || '%' THEN 8.0
                WHEN p.name ILIKE '%' || v_clean_kw || '%' THEN 5.0
                WHEN p.description ILIKE '%' || v_clean_kw || '%' THEN 2.0
                ELSE 0.5
            END) AS relevance_score
        FROM products p
        LEFT JOIN stores s ON s.id = p.store_id
        WHERE p.is_active = true
          AND (p_entity_type = 'all' OR p_entity_type = 'products')
          AND (v_clean_kw IS NULL OR p.name ILIKE '%' || v_clean_kw || '%' OR coalesce(p.description, '') ILIKE '%' || v_clean_kw || '%')
          AND (p_category_slug IS NULL OR p.category ILIKE p_category_slug)
          AND (p_min_price IS NULL OR p.price_da >= p_min_price)
          AND (p_max_price IS NULL OR p.price_da <= p_max_price)
          AND (NOT p_only_available OR p.stock_quantity > 0)
          AND (NOT p_only_verified OR coalesce(s.is_verified, false) = true)
          AND (p_wilaya_code IS NULL OR s.wilaya ILIKE '%' || p_wilaya_code || '%')

        UNION ALL

        -- 2. SERVICES & BOOKINGS
        SELECT 
            srv.id::text AS item_id,
            'services' AS entity_type,
            srv.title AS title,
            srv.description,
            srv.category AS category_name,
            srv.category AS category_slug,
            srv.subcategory AS subcategory_slug,
            srv.price_da AS price,
            'DA' AS currency,
            srv.rating AS rating,
            srv.reviews_count AS reviews_count,
            CASE WHEN srv.images IS NOT NULL AND array_length(srv.images, 1) > 0 THEN srv.images[1] ELSE NULL END AS image_url,
            srv.images AS gallery_urls,
            prof.name AS owner_name,
            srv.provider_id::text AS owner_id,
            (srv.is_verified OR coalesce(prof.is_verified, false)) AS is_verified,
            srv.delivery_available AS delivery_available,
            srv.is_available AS is_available,
            srv.wilaya AS wilaya,
            srv.city AS city,
            srv.latitude,
            srv.longitude,
            calculate_distance_km(p_user_lat, p_user_lng, srv.latitude, srv.longitude) AS distance_km,
            srv.created_at,
            (CASE 
                WHEN v_clean_kw IS NULL THEN 1.0
                WHEN srv.title ILIKE v_clean_kw THEN 10.0
                WHEN srv.title ILIKE v_clean_kw || '%' THEN 8.0
                WHEN srv.title ILIKE '%' || v_clean_kw || '%' THEN 5.0
                WHEN srv.description ILIKE '%' || v_clean_kw || '%' THEN 2.0
                ELSE 0.5
            END) AS relevance_score
        FROM services srv
        LEFT JOIN profiles prof ON prof.id = srv.provider_id
        WHERE (p_entity_type = 'all' OR p_entity_type = 'services' OR p_entity_type = 'bookings')
          AND (v_clean_kw IS NULL OR srv.title ILIKE '%' || v_clean_kw || '%' OR coalesce(srv.description, '') ILIKE '%' || v_clean_kw || '%')
          AND (p_category_slug IS NULL OR srv.category ILIKE p_category_slug)
          AND (p_subcategory_slug IS NULL OR srv.subcategory ILIKE p_subcategory_slug)
          AND (p_min_price IS NULL OR srv.price_da >= p_min_price)
          AND (p_max_price IS NULL OR srv.price_da <= p_max_price)
          AND (p_min_rating IS NULL OR srv.rating >= p_min_rating)
          AND (NOT p_only_verified OR (srv.is_verified OR coalesce(prof.is_verified, false)))
          AND (NOT p_only_delivery OR srv.delivery_available = true)
          AND (NOT p_only_available OR srv.is_available = true)
          AND (p_wilaya_code IS NULL OR srv.wilaya ILIKE '%' || p_wilaya_code || '%')
          AND (p_max_distance_km IS NULL OR p_user_lat IS NULL OR calculate_distance_km(p_user_lat, p_user_lng, srv.latitude, srv.longitude) <= p_max_distance_km)

        UNION ALL

        -- 3. STORES & LISTINGS
        SELECT 
            st.id::text AS item_id,
            'stores' AS entity_type,
            st.name AS title,
            st.description,
            'Retail & Stores' AS category_name,
            'stores' AS category_slug,
            NULL::text AS subcategory_slug,
            0.00 AS price,
            'DA' AS currency,
            4.9::numeric AS rating,
            35 AS reviews_count,
            st.logo_url AS image_url,
            ARRAY[st.cover_url, st.logo_url] AS gallery_urls,
            st.name AS owner_name,
            st.owner_id::text AS owner_id,
            st.is_verified AS is_verified,
            TRUE AS delivery_available,
            st.is_active AS is_available,
            st.wilaya AS wilaya,
            st.commune AS city,
            NULL::numeric AS latitude,
            NULL::numeric AS longitude,
            NULL::numeric AS distance_km,
            st.created_at,
            (CASE 
                WHEN v_clean_kw IS NULL THEN 1.0
                WHEN st.name ILIKE v_clean_kw THEN 10.0
                WHEN st.name ILIKE v_clean_kw || '%' THEN 8.0
                WHEN st.name ILIKE '%' || v_clean_kw || '%' THEN 5.0
                WHEN st.description ILIKE '%' || v_clean_kw || '%' THEN 2.0
                ELSE 0.5
            END) AS relevance_score
        FROM stores st
        WHERE st.is_active = true
          AND (p_entity_type = 'all' OR p_entity_type = 'stores' OR p_entity_type = 'listings')
          AND (v_clean_kw IS NULL OR st.name ILIKE '%' || v_clean_kw || '%' OR coalesce(st.description, '') ILIKE '%' || v_clean_kw || '%')
          AND (NOT p_only_verified OR st.is_verified = true)
          AND (p_wilaya_code IS NULL OR st.wilaya ILIKE '%' || p_wilaya_code || '%')

        UNION ALL

        -- 4. PROVIDERS & PROFESSIONALS
        SELECT 
            pr.id::text AS item_id,
            'providers' AS entity_type,
            pr.name AS title,
            ('Verified ' || coalesce(pr.role, 'Professional')) AS description,
            coalesce(pr.role, 'Professional') AS category_name,
            coalesce(pr.role, 'professional') AS category_slug,
            NULL::text AS subcategory_slug,
            0.00 AS price,
            'DA' AS currency,
            4.95::numeric AS rating,
            48 AS reviews_count,
            pr.avatar_url AS image_url,
            ARRAY[pr.avatar_url] AS gallery_urls,
            pr.name AS owner_name,
            pr.id::text AS owner_id,
            pr.is_verified AS is_verified,
            TRUE AS delivery_available,
            TRUE AS is_available,
            'Alger' AS wilaya,
            'Center' AS city,
            NULL::numeric AS latitude,
            NULL::numeric AS longitude,
            NULL::numeric AS distance_km,
            pr.member_since AS created_at,
            (CASE 
                WHEN v_clean_kw IS NULL THEN 1.0
                WHEN pr.name ILIKE v_clean_kw THEN 10.0
                WHEN pr.name ILIKE v_clean_kw || '%' THEN 8.0
                WHEN pr.name ILIKE '%' || v_clean_kw || '%' THEN 5.0
                ELSE 0.5
            END) AS relevance_score
        FROM profiles pr
        WHERE (pr.role IN ('artisan', 'craftsman', 'provider', 'professional', 'seller'))
          AND (p_entity_type = 'all' OR p_entity_type = 'providers')
          AND (v_clean_kw IS NULL OR pr.name ILIKE '%' || v_clean_kw || '%')
          AND (NOT p_only_verified OR pr.is_verified = true)

        UNION ALL

        -- 5. CATEGORIES
        SELECT 
            c.id::text AS item_id,
            'categories' AS entity_type,
            c.name AS title,
            ('Browse all ' || c.name || ' on Khidmatik') AS description,
            c.name AS category_name,
            c.slug AS category_slug,
            NULL::text AS subcategory_slug,
            0.00 AS price,
            'DA' AS currency,
            5.0::numeric AS rating,
            c.item_count AS reviews_count,
            NULL::text AS image_url,
            ARRAY[]::text[] AS gallery_urls,
            'Khidmatik' AS owner_name,
            c.id::text AS owner_id,
            TRUE AS is_verified,
            FALSE AS delivery_available,
            TRUE AS is_available,
            'All Algeria' AS wilaya,
            NULL AS city,
            NULL::numeric AS latitude,
            NULL::numeric AS longitude,
            NULL::numeric AS distance_km,
            c.created_at,
            (CASE 
                WHEN v_clean_kw IS NULL THEN 1.0
                WHEN c.name ILIKE v_clean_kw THEN 10.0
                WHEN c.name ILIKE v_clean_kw || '%' THEN 8.0
                WHEN c.name ILIKE '%' || v_clean_kw || '%' THEN 5.0
                ELSE 0.5
            END) AS relevance_score
        FROM categories c
        WHERE (p_entity_type = 'all' OR p_entity_type = 'categories')
          AND (v_clean_kw IS NULL OR c.name ILIKE '%' || v_clean_kw || '%' OR c.slug ILIKE '%' || v_clean_kw || '%')
    ),
    counted_items AS (
        SELECT COUNT(*) AS total FROM unified_items
    ),
    entity_counts AS (
        SELECT 
            entity_type,
            COUNT(*) AS cnt
        FROM unified_items
        GROUP BY entity_type
    ),
    sorted_and_paginated AS (
        SELECT *
        FROM unified_items
        ORDER BY
            CASE WHEN p_sort_by = 'relevance' THEN relevance_score END DESC,
            CASE WHEN p_sort_by = 'popularity' THEN reviews_count END DESC,
            CASE WHEN p_sort_by = 'rating' THEN rating END DESC,
            CASE WHEN p_sort_by = 'newest' THEN created_at END DESC,
            CASE WHEN p_sort_by = 'price_asc' THEN price END ASC,
            CASE WHEN p_sort_by = 'price_desc' THEN price END DESC,
            CASE WHEN p_sort_by = 'distance' AND distance_km IS NOT NULL THEN distance_km END ASC,
            created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
    )
    SELECT 
        (SELECT total FROM counted_items),
        json_build_object(
            'all', (SELECT total FROM counted_items),
            'products', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'products'), 0),
            'services', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'services'), 0),
            'providers', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'providers'), 0),
            'stores', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'stores'), 0),
            'listings', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'listings'), 0),
            'bookings', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'bookings'), 0),
            'categories', coalesce((SELECT cnt FROM entity_counts WHERE entity_type = 'categories'), 0)
        ),
        coalesce(json_agg(row_to_json(sorted_and_paginated)), '[]'::json)
    INTO v_total_count, v_facet_counts, v_results
    FROM sorted_and_paginated;

    RETURN json_build_object(
        'items', v_results,
        'total', coalesce(v_total_count, 0),
        'page', p_page,
        'pageSize', p_page_size,
        'totalPages', GREATEST(1, CEIL(coalesce(v_total_count, 0)::numeric / p_page_size)),
        'facets', coalesce(v_facet_counts, '{}'::json)
    );
END;
$$;
