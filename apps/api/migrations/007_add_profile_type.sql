-- ============================================================
-- Migration 007: profile_type
-- Adiciona suporte a múltiplos tipos de perfil na tabela artists
-- ============================================================

CREATE TYPE public.artist_type AS ENUM ('musician', 'tattoo');

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS profile_type public.artist_type NOT NULL DEFAULT 'musician';

CREATE INDEX IF NOT EXISTS idx_artists_profile_type ON public.artists(profile_type);

COMMENT ON COLUMN public.artists.profile_type IS
  'Tipo do perfil: musician = músico, tattoo = tatuador. '
  'Controla renderização contextual no frontend. '
  'Não altera estrutura de dados — apenas semântica visual.';
