-- ============================================================
-- Migration 005: media_assets
-- Arquivos de mídia (áudio e imagem) vinculados ao artista
-- ============================================================

CREATE TYPE public.media_type AS ENUM ('audio', 'image');

CREATE TABLE IF NOT EXISTS public.media_assets (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID              NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  -- Entidade à qual este asset está vinculado (track, project, etc.)
  entity_type  VARCHAR(50),
  entity_id    UUID,
  media_type   public.media_type NOT NULL,
  -- storage_key: caminho no Supabase Storage bucket
  -- NUNCA exposto diretamente — sempre via URL assinada
  storage_key  TEXT              NOT NULL UNIQUE,
  original_name VARCHAR(255),   -- nome original sanitizado para log apenas
  mime_type    VARCHAR(100)      NOT NULL,
  size_bytes   INTEGER           NOT NULL,
  width        INTEGER,          -- apenas para imagens
  height       INTEGER,          -- apenas para imagens
  duration_sec INTEGER,          -- apenas para áudio
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT media_assets_size_check CHECK (size_bytes > 0),
  -- Áudio: máx 50MB | Imagem: máx 5MB
  CONSTRAINT media_assets_audio_size CHECK (
    media_type != 'audio' OR size_bytes <= 52428800
  ),
  CONSTRAINT media_assets_image_size CHECK (
    media_type != 'image' OR size_bytes <= 5242880
  )
);

-- Índices
CREATE INDEX idx_media_assets_artist_id   ON public.media_assets(artist_id);
CREATE INDEX idx_media_assets_entity      ON public.media_assets(entity_type, entity_id);
CREATE INDEX idx_media_assets_storage_key ON public.media_assets(storage_key);

-- RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_assets: leitura pelo artista"
  ON public.media_assets FOR SELECT
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "media_assets: escrita pelo artista"
  ON public.media_assets FOR INSERT
  WITH CHECK (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "media_assets: deleção pelo artista"
  ON public.media_assets FOR DELETE
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );
