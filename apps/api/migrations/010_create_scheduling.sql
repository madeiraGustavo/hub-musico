-- ============================================================
-- Migration 010: scheduling system
-- Adiciona timezone ao Artist, cria enum appointment_status,
-- e as tabelas availability_rules, availability_blocks e appointments
-- ============================================================

-- 1. Novo campo timezone na tabela artists
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo';

-- 2. Enum para status de agendamento
CREATE TYPE public.appointment_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'REJECTED'
);

-- 3. Tabela de regras de disponibilidade recorrentes
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID         NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  weekday      INTEGER      NOT NULL,
  start_time   VARCHAR(5)   NOT NULL,
  end_time     VARCHAR(5)   NOT NULL,
  slot_minutes INTEGER      NOT NULL DEFAULT 60,
  active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT availability_rules_weekday_range CHECK (weekday >= 0 AND weekday <= 6),
  CONSTRAINT availability_rules_slot_minutes_positive CHECK (slot_minutes > 0)
);

CREATE TRIGGER availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_availability_rules_artist_weekday
  ON public.availability_rules(artist_id, weekday);

-- 4. Tabela de bloqueios pontuais de agenda
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id  UUID        NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT availability_blocks_temporal_order CHECK (start_at < end_at)
);

CREATE TRIGGER availability_blocks_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_availability_blocks_artist_start
  ON public.availability_blocks(artist_id, start_at);

-- 5. Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID                       NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  requester_name  VARCHAR(100)               NOT NULL,
  requester_email VARCHAR(255)               NOT NULL,
  requester_phone VARCHAR(20),
  service_id      UUID                       REFERENCES public.services(id) ON DELETE SET NULL,
  start_at        TIMESTAMPTZ                NOT NULL,
  end_at          TIMESTAMPTZ                NOT NULL,
  status          public.appointment_status  NOT NULL DEFAULT 'PENDING',
  notes           TEXT,
  request_code    UUID                       NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ                NOT NULL DEFAULT NOW(),

  CONSTRAINT appointments_temporal_order CHECK (start_at < end_at),

  -- Chave de idempotência: mesma combinação artista + horário + email não gera duplicata
  CONSTRAINT idempotency_key UNIQUE (artist_id, start_at, requester_email)
);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_appointments_artist_start
  ON public.appointments(artist_id, start_at);
