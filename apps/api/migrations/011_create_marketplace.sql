-- ============================================================
-- Migration 011: marketplace de lonas
-- Cria enums product_type, quote_status, order_status e as
-- tabelas marketplace_categories, marketplace_products,
-- marketplace_product_images, marketplace_quote_requests,
-- marketplace_orders e marketplace_order_items
-- ============================================================

-- 1. Enums do marketplace
CREATE TYPE public.product_type AS ENUM (
  'FIXED_PRICE',
  'QUOTE_ONLY'
);

CREATE TYPE public.quote_status AS ENUM (
  'PENDING',
  'ANSWERED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED'
);

CREATE TYPE public.order_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

-- 2. Tabela de categorias do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id  UUID         NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  icon       VARCHAR(50),
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT marketplace_category_artist_slug UNIQUE (artist_id, slug)
);

CREATE TRIGGER marketplace_categories_updated_at
  BEFORE UPDATE ON public.marketplace_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketplace_categories_artist_sort
  ON public.marketplace_categories(artist_id, sort_order);

-- 3. Tabela de produtos do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id         UUID           NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  category_id       UUID           NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
  title             VARCHAR(150)   NOT NULL,
  slug              VARCHAR(180)   NOT NULL,
  description       TEXT,
  short_description VARCHAR(300),
  type              public.product_type NOT NULL,
  base_price        DECIMAL(10, 2),
  active            BOOLEAN        NOT NULL DEFAULT FALSE,
  featured          BOOLEAN        NOT NULL DEFAULT FALSE,
  customizable      BOOLEAN        NOT NULL DEFAULT FALSE,
  stock             INTEGER,
  width_cm          DECIMAL(7, 1),
  height_cm         DECIMAL(7, 1),
  material          VARCHAR(100),
  color             VARCHAR(50),
  sort_order        INTEGER        NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT marketplace_product_artist_slug UNIQUE (artist_id, slug)
);

CREATE TRIGGER marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketplace_products_artist_active
  ON public.marketplace_products(artist_id, active);

CREATE INDEX idx_marketplace_products_category
  ON public.marketplace_products(category_id);

CREATE INDEX idx_marketplace_products_active_sort
  ON public.marketplace_products(active, sort_order);

CREATE INDEX idx_marketplace_products_active_featured
  ON public.marketplace_products(active, featured);

-- 4. Tabela de imagens de produtos do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_product_images (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID        NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  alt        VARCHAR(255),
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_product_images_product_sort
  ON public.marketplace_product_images(product_id, sort_order);

-- 5. Tabela de solicitações de orçamento do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_quote_requests (
  id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID                NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  product_id       UUID                NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  requester_name   VARCHAR(100)        NOT NULL,
  requester_email  VARCHAR(255)        NOT NULL,
  requester_phone  VARCHAR(20),
  message          TEXT                NOT NULL,
  width_cm         DECIMAL(7, 1),
  height_cm        DECIMAL(7, 1),
  quantity         INTEGER             NOT NULL DEFAULT 1,
  status           public.quote_status NOT NULL DEFAULT 'PENDING',
  response_message TEXT,
  created_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TRIGGER marketplace_quote_requests_updated_at
  BEFORE UPDATE ON public.marketplace_quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketplace_quote_requests_artist_status
  ON public.marketplace_quote_requests(artist_id, status);

CREATE INDEX idx_marketplace_quote_requests_artist_created
  ON public.marketplace_quote_requests(artist_id, created_at);

-- 6. Tabela de pedidos do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id             UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id      UUID                NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  customer_name  VARCHAR(100)        NOT NULL,
  customer_email VARCHAR(255)        NOT NULL,
  customer_phone VARCHAR(20),
  total          DECIMAL(12, 2)      NOT NULL,
  status         public.order_status NOT NULL DEFAULT 'PENDING',
  created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TRIGGER marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_marketplace_orders_artist_status
  ON public.marketplace_orders(artist_id, status);

CREATE INDEX idx_marketplace_orders_artist_created
  ON public.marketplace_orders(artist_id, created_at);

-- 7. Tabela de itens de pedido do marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
  id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID           NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID           NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  quantity   INTEGER        NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_marketplace_order_items_order
  ON public.marketplace_order_items(order_id);
