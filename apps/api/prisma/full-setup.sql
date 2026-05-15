-- ============================================================
-- FULL SETUP: Migrações + Seed do Marketplace
-- Cole este SQL inteiro no SQL Editor do Supabase e clique Run
-- ============================================================

-- ── Migration 001: users ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
    CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── Migration 002: artists ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.artists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  tagline     TEXT,
  bio         TEXT[],
  location    VARCHAR(100),
  reach       VARCHAR(100),
  email       VARCHAR(255),
  whatsapp    VARCHAR(20),
  skills      TEXT[]      NOT NULL DEFAULT '{}',
  tools       TEXT[]      NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'artists_updated_at') THEN
    CREATE TRIGGER artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_artists_user_id ON public.artists(user_id);
CREATE INDEX IF NOT EXISTS idx_artists_slug ON public.artists(slug);

-- ── Migration 003: tracks ─────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.track_genre AS ENUM ('piano','jazz','ambient','orquestral','rock','demo','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  genre public.track_genre NOT NULL DEFAULT 'outro',
  genre_label VARCHAR(50) NOT NULL,
  duration VARCHAR(10),
  key VARCHAR(10),
  storage_key TEXT,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON public.tracks(artist_id);

-- ── Migration 004: projects ───────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.project_platform AS ENUM ('youtube','spotify','soundcloud','outro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.project_status AS ENUM ('draft','active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  year_label VARCHAR(20),
  platform public.project_platform NOT NULL DEFAULT 'outro',
  tags TEXT[] NOT NULL DEFAULT '{}',
  href TEXT NOT NULL,
  thumbnail_url TEXT,
  spotify_id VARCHAR(50),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  background_style TEXT,
  background_position VARCHAR(50),
  background_size VARCHAR(50),
  status public.project_status NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_artist_id ON public.projects(artist_id);

-- ── Migration 005: media_assets ───────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.media_type AS ENUM ('audio','image'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  entity_type VARCHAR(50),
  entity_id UUID,
  media_type public.media_type NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  original_name VARCHAR(255),
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Migration 006: RBAC ───────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('admin','artist','editor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'artist';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES public.artists(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_artist_id ON public.users(artist_id);

-- ── Migration 007: profile_type ───────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.artist_type AS ENUM ('musician','tattoo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS profile_type public.artist_type NOT NULL DEFAULT 'musician';
CREATE INDEX IF NOT EXISTS idx_artists_profile_type ON public.artists(profile_type);

-- ── Migration 009: services ───────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.service_icon AS ENUM ('drum','mic','music','compose','needle','camera','calendar','star'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  icon public.service_icon NOT NULL DEFAULT 'star',
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  price VARCHAR(100) NOT NULL,
  highlight BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_artist_id ON public.services(artist_id);

-- ── Migration 010: scheduling ─────────────────────────────────────────────────

ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo';

DO $$ BEGIN CREATE TYPE public.appointment_status AS ENUM ('PENDING','CONFIRMED','CANCELLED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  slot_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_rules_artist_weekday ON public.availability_rules(artist_id, weekday);

CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  requester_name VARCHAR(100) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(20),
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  request_code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_artist_start ON public.appointments(artist_id, start_at);

-- ── Migration 011: marketplace ────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE public.product_type AS ENUM ('FIXED_PRICE','QUOTE_ONLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.quote_status AS ENUM ('PENDING','ANSWERED','ACCEPTED','REJECTED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_category_artist_slug UNIQUE (artist_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_artist_sort ON public.marketplace_categories(artist_id, sort_order);

CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT,
  short_description VARCHAR(300),
  type public.product_type NOT NULL,
  base_price DECIMAL(10,2),
  active BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  customizable BOOLEAN NOT NULL DEFAULT FALSE,
  stock INTEGER,
  width_cm DECIMAL(7,1),
  height_cm DECIMAL(7,1),
  material VARCHAR(100),
  color VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_product_artist_slug UNIQUE (artist_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_artist_active ON public.marketplace_products(artist_id, active);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON public.marketplace_products(category_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active_sort ON public.marketplace_products(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_active_featured ON public.marketplace_products(active, featured);

CREATE TABLE IF NOT EXISTS public.marketplace_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  requester_name VARCHAR(100) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(20),
  message TEXT NOT NULL,
  width_cm DECIMAL(7,1),
  height_cm DECIMAL(7,1),
  quantity INTEGER NOT NULL DEFAULT 1,
  status public.quote_status NOT NULL DEFAULT 'PENDING',
  response_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_quote_requests_artist_status ON public.marketplace_quote_requests(artist_id, status);

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  total DECIMAL(12,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_artist_status ON public.marketplace_orders(artist_id, status);

CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON public.marketplace_order_items(order_id);

-- Disable RLS for API access (API uses service role key)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_quote_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items DISABLE ROW LEVEL SECURITY;
