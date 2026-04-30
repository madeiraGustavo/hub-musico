-- ============================================================
-- Migration 002: artists
-- Perfil público do artista vinculado ao usuário autenticado
-- ============================================================

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

CREATE TRIGGER artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_artists_user_id ON public.artists(user_id);
CREATE INDEX idx_artists_slug    ON public.artists(slug);

-- RLS
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Leitura pública do perfil ativo
CREATE POLICY "artists: leitura pública"
  ON public.artists FOR SELECT
  USING (is_active = TRUE);

-- Escrita apenas pelo próprio artista
CREATE POLICY "artists: escrita própria"
  ON public.artists FOR ALL
  USING (user_id = auth.uid());
