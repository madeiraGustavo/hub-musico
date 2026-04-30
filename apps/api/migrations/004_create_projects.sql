-- ============================================================
-- Migration 004: projects
-- Projetos/trabalhos do artista
-- ============================================================

CREATE TYPE public.project_platform AS ENUM ('youtube', 'spotify', 'soundcloud', 'outro');
CREATE TYPE public.project_status   AS ENUM ('draft', 'active', 'archived');

CREATE TABLE IF NOT EXISTS public.projects (
  id                 UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id          UUID                    NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title              VARCHAR(100)            NOT NULL,
  description        TEXT,
  year_label         VARCHAR(20),
  platform           public.project_platform NOT NULL DEFAULT 'outro',
  tags               TEXT[]                  NOT NULL DEFAULT '{}',
  href               TEXT                    NOT NULL,
  thumbnail_url      TEXT,
  spotify_id         VARCHAR(50),
  featured           BOOLEAN                 NOT NULL DEFAULT FALSE,
  background_style   TEXT,
  background_position VARCHAR(50),
  background_size    VARCHAR(50),
  status             public.project_status   NOT NULL DEFAULT 'active',
  sort_order         INTEGER                 NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_title_length CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  -- Apenas um projeto featured por artista
  CONSTRAINT projects_one_featured UNIQUE NULLS NOT DISTINCT (artist_id, featured)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_projects_artist_id  ON public.projects(artist_id);
CREATE INDEX idx_projects_status     ON public.projects(status);
CREATE INDEX idx_projects_sort_order ON public.projects(artist_id, sort_order);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: leitura pública de ativos"
  ON public.projects FOR SELECT
  USING (status = 'active');

CREATE POLICY "projects: escrita pelo artista"
  ON public.projects FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE user_id = auth.uid()
    )
  );
