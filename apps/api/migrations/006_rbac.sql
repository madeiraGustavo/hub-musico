-- ============================================================
-- Migration 006: RBAC
-- Papéis: admin | artist | editor
-- ============================================================

CREATE TYPE public.user_role AS ENUM ('admin', 'artist', 'editor');

-- Adiciona role e artist_id à tabela users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role       public.user_role NOT NULL DEFAULT 'artist',
  ADD COLUMN IF NOT EXISTS artist_id  UUID REFERENCES public.artists(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_artist_id ON public.users(artist_id);

-- ── Atualiza RLS de artists ───────────────────────────────────────────────────

-- Admin pode ver todos os artistas
CREATE POLICY "artists: admin lê tudo"
  ON public.artists FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Atualiza RLS de tracks ────────────────────────────────────────────────────

-- Editor pode editar tracks do seu artista (mas não deletar)
CREATE POLICY "tracks: editor atualiza"
  ON public.tracks FOR UPDATE
  USING (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role IN ('artist', 'editor')
    )
  );

-- Artist e editor podem inserir
CREATE POLICY "tracks: artist e editor inserem"
  ON public.tracks FOR INSERT
  WITH CHECK (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role IN ('artist', 'editor')
    )
  );

-- Apenas artist pode deletar suas próprias tracks
CREATE POLICY "tracks: artist deleta"
  ON public.tracks FOR DELETE
  USING (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role = 'artist'
    )
  );

-- ── Atualiza RLS de projects ──────────────────────────────────────────────────

CREATE POLICY "projects: artist e editor inserem"
  ON public.projects FOR INSERT
  WITH CHECK (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role IN ('artist', 'editor')
    )
  );

CREATE POLICY "projects: editor atualiza"
  ON public.projects FOR UPDATE
  USING (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role IN ('artist', 'editor')
    )
  );

CREATE POLICY "projects: artist deleta"
  ON public.projects FOR DELETE
  USING (
    artist_id IN (
      SELECT artist_id FROM public.users
      WHERE id = auth.uid() AND role = 'artist'
    )
  );

-- ── View segura para o dashboard ─────────────────────────────────────────────
-- Retorna apenas os dados do artista do usuário autenticado

CREATE OR REPLACE VIEW public.my_artist AS
  SELECT a.*
  FROM public.artists a
  INNER JOIN public.users u ON u.artist_id = a.id
  WHERE u.id = auth.uid();
