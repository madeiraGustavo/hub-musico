-- ============================================================
-- Migration 008: corrige constraint de featured em projects
--
-- Problema: UNIQUE NULLS NOT DISTINCT (artist_id, featured)
-- impedia múltiplos projetos com featured=false por artista.
--
-- Solução: índice parcial — apenas um featured=true por artista.
-- ============================================================

-- Remove a constraint incorreta
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_one_featured;

-- Índice parcial correto: apenas um projeto featured=true por artista
CREATE UNIQUE INDEX IF NOT EXISTS projects_one_featured_true
  ON public.projects (artist_id)
  WHERE featured = true;

COMMENT ON INDEX projects_one_featured_true IS
  'Garante no máximo um projeto featured=true por artista. '
  'Projetos featured=false são ilimitados.';
