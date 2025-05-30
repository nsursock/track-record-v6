-- Drop all analytics tables
DROP TABLE IF EXISTS public.pageviews CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.browser_info CASCADE;
DROP TABLE IF EXISTS public.device_info CASCADE;
DROP TABLE IF EXISTS public.os_info CASCADE;
DROP TABLE IF EXISTS public.location_info CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.visitors CASCADE;

-- Create visitors table
CREATE TABLE public.visitors (
    visitor_id TEXT PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL
);

-- Create sessions table
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
    entry_page TEXT NOT NULL,
    referrer_source TEXT,
    referrer_medium TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL
);

-- Create pageviews table
CREATE TABLE public.pageviews (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    referrer TEXT,
    duration INTEGER,
    viewed_at TIMESTAMPTZ NOT NULL
);

-- Create events table
CREATE TABLE public.events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    visitor_id TEXT REFERENCES public.visitors(visitor_id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_category TEXT,
    event_action TEXT,
    event_label TEXT,
    event_value INTEGER,
    custom_properties JSONB,
    occurred_at TIMESTAMPTZ NOT NULL
);

-- Create browser_info table
CREATE TABLE public.browser_info (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    browser_name TEXT NOT NULL,
    browser_version TEXT,
    engine_name TEXT,
    engine_version TEXT,
    is_mobile BOOLEAN DEFAULT false,
    is_tablet BOOLEAN DEFAULT false,
    is_desktop BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create device_info table
CREATE TABLE public.device_info (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL,
    device_vendor TEXT,
    device_model TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    viewport_width INTEGER,
    viewport_height INTEGER,
    pixel_ratio DECIMAL(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create os_info table
CREATE TABLE public.os_info (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    os_name TEXT NOT NULL,
    os_version TEXT,
    architecture TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create location_info table
CREATE TABLE public.location_info (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES public.sessions(id) ON DELETE CASCADE,
    ip_address INET,
    country_code TEXT,
    country_name TEXT,
    region_code TEXT,
    region_name TEXT,
    city TEXT,
    timezone TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 