-- ============================================================
-- Migration 012: Multi-Tenant — adicionar site_id aos users
--
-- Mudanças:
-- 1. Adiciona role 'client' ao enum user_role
-- 2. Adiciona coluna site_id com default 'platform'
-- 3. Remove unique constraint de email (users_email_key)
-- 4. Cria unique index composto (site_id, email)
-- 5. Cria index para queries por site_id
--
-- Segurança:
-- - Usuários existentes recebem site_id = 'platform' automaticamente
-- - Nenhum dado é perdido ou alterado
-- - Rollback possível removendo coluna e recriando unique(email)
-- ============================================================

-- 1. Adicionar role 'client' ao enum (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'client'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'client';
  END IF;
END
$$;

-- 2. Adicionar coluna site_id com default 'platform'
-- Todos os usuários existentes recebem 'platform' automaticamente
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) NOT NULL DEFAULT 'platform';

-- 3. Remover unique constraint de email
-- O nome da constraint pode variar — tentar ambos os formatos comuns
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;

-- Também remover index único se existir (Prisma às vezes cria como index)
DROP INDEX IF EXISTS users_email_key;

-- 4. Criar unique index composto (site_id, email)
CREATE UNIQUE INDEX IF NOT EXISTS users_site_email_unique
  ON public.users(site_id, email);

-- 5. Index para queries filtradas por site_id
CREATE INDEX IF NOT EXISTS idx_users_site_id
  ON public.users(site_id);
