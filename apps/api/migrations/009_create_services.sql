-- ============================================================
-- Migration 009: services
-- Serviços oferecidos pelo artista (visíveis no portfólio público)
-- ============================================================

CREATE TYPE public.service_icon AS ENUM (
  'drum', 'mic', 'music', 'compose', 'needle', 'camera', 'calendar', 'star'
);

CREATE TABLE IF NOT EXISTS public.services (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id   UUID                NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  icon        public.service_icon NOT NULL DEFAULT 'star',
  title       VARCHAR(100)        NOT NULL,
  description TEXT                NOT NULL,
  items       TEXT[]              NOT NULL DEFAULT '{}',
  price       VARCHAR(100)        NOT NULL,
  highlight   BOOLEAN             NOT NULL DEFAULT FALSE,
  sort_order  INTEGER             NOT NULL DEFAULT 0,
  active      BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT services_title_length      CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  CONSTRAINT services_description_length CHECK (char_length(description) >= 10 AND char_length(description) <= 500)
);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_services_artist_id  ON public.services(artist_id);
CREATE INDEX idx_services_sort_order ON public.services(artist_id, sort_order);
CREATE INDEX idx_services_active     ON public.services(artist_id, active);

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services: leitura pública de ativos"
  ON public.services FOR SELECT
  USING (active = TRUE);

CREATE POLICY "services: escrita pelo artista"
  ON public.services FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );
