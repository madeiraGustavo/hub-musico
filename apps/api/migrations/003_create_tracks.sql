-- ============================================================
-- Migration 003: tracks
-- Faixas musicais do artista
-- ============================================================

CREATE TYPE public.track_genre AS ENUM (
  'piano', 'jazz', 'ambient', 'orquestral', 'rock', 'demo', 'outro'
);

CREATE TABLE IF NOT EXISTS public.tracks (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID              NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title        VARCHAR(100)      NOT NULL,
  genre        public.track_genre NOT NULL DEFAULT 'outro',
  genre_label  VARCHAR(50)       NOT NULL,
  duration     VARCHAR(10),
  key          VARCHAR(10),
  -- storage_key: chave do arquivo no Supabase Storage (nunca exposta diretamente)
  storage_key  TEXT,
  mime_type    VARCHAR(100),
  size_bytes   INTEGER,
  is_public    BOOLEAN           NOT NULL DEFAULT TRUE,
  sort_order   INTEGER           NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT tracks_title_length CHECK (char_length(title) >= 2 AND char_length(title) <= 100)
);

CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_tracks_artist_id  ON public.tracks(artist_id);
CREATE INDEX idx_tracks_genre      ON public.tracks(genre);
CREATE INDEX idx_tracks_sort_order ON public.tracks(artist_id, sort_order);

-- RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracks: leitura pública"
  ON public.tracks FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "tracks: escrita pelo artista"
  ON public.tracks FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );
