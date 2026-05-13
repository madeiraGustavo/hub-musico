/**
 * public-scheduling.service.ts
 *
 * Orquestra Availability_Service e Appointment_Service para os endpoints públicos.
 * Não conhece FastifyRequest/FastifyReply — recebe e retorna DTOs tipados.
 * Lança erros com `code` para que o controller mapeie ao HTTP correto.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3, 4.5, 4.6, 4.7, 5.2, 5.3
 */

import { prisma } from '../../lib/prisma.js'
import type { Prisma } from '@prisma/client'
import {
  generateSlots,
  filterConflicts,
  type Slot,
} from '../availability/availability.service.js'
import { findConflicts } from '../appointments/appointments.repository.js'
import type { PublicCreateAppointmentBody } from './public-scheduling.schemas.js'

// ── Constantes ────────────────────────────────────────────────────────────────

const MIN_ADVANCE_MS = 24 * 60 * 60 * 1000       // 24 horas em ms
const MAX_ADVANCE_MS = 60 * 24 * 60 * 60 * 1000  // 60 dias em ms

// ── Tipos de erro ─────────────────────────────────────────────────────────────

/**
 * Erro tipado lançado pelo service.
 * O controller inspeciona `code` para determinar o status HTTP:
 *   - 'NOT_FOUND'         → 404
 *   - 'CONFLICT'          → 409
 *   - 'ADVANCE_TOO_SHORT' → 422
 *   - 'ADVANCE_TOO_LONG'  → 422
 */
export class PublicSchedulingError extends Error {
  constructor(
    public readonly code:
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'ADVANCE_TOO_SHORT'
      | 'ADVANCE_TOO_LONG',
    message: string,
  ) {
    super(message)
    this.name = 'PublicSchedulingError'
  }
}

// ── Tipos de resposta ─────────────────────────────────────────────────────────

export interface PublicAvailabilityResult {
  artistId: string
  timezone: string
  slots:    Slot[]
}

export interface PublicAppointmentStatusResult {
  requestCode: string
  status:      'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED'
  startAt:     Date
  endAt:       Date
}

// ── getPublicAvailability ─────────────────────────────────────────────────────

/**
 * Calcula os slots livres de um artista para o período [from, to].
 *
 * Fluxo:
 * 1. Buscar artista (timezone) — lança NOT_FOUND se não existir
 * 2. Buscar AvailabilityRules ativas
 * 3. Chamar generateSlots(rules, from, to, timezone)
 * 4. Buscar Appointments PENDING/CONFIRMED no período
 * 5. Buscar AvailabilityBlocks no período
 * 6. Chamar filterConflicts(slots, [...appointments, ...blocks])
 * 7. Retornar { artistId, timezone, slots }
 *
 * NUNCA retorna dados de Appointments — apenas slots livres.
 *
 * @param artistId - UUID do artista
 * @param from     - Início do período (Date, UTC midnight)
 * @param to       - Fim do período (Date, UTC midnight, inclusive)
 * @returns        - { artistId, timezone, slots }
 *
 * @throws PublicSchedulingError com code 'NOT_FOUND' se o artista não existir
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 8.2, 8.3, 8.5, 9.1
 */
export async function getPublicAvailability(
  artistId: string,
  from:     Date,
  to:       Date,
): Promise<PublicAvailabilityResult> {
  // 1. Buscar artista (timezone)
  const artist = await prisma.artist.findUnique({
    where:  { id: artistId },
    select: { id: true, timezone: true },
  })

  if (!artist) {
    throw new PublicSchedulingError('NOT_FOUND', 'Artista não encontrado')
  }

  // 2. Buscar AvailabilityRules ativas
  const rules = await prisma.availabilityRule.findMany({
    where:  { artistId, active: true },
    select: {
      weekday:     true,
      startTime:   true,
      endTime:     true,
      slotMinutes: true,
      active:      true,
    },
  })

  // 3. Gerar slots a partir das regras ativas
  const allSlots = generateSlots(rules, from, to, artist.timezone)

  // 4. Buscar Appointments PENDING/CONFIRMED no período
  // Usamos uma janela ligeiramente ampliada para capturar conflitos parciais:
  // appointments que começam antes de `to` e terminam depois de `from`.
  const appointments = await prisma.appointment.findMany({
    where: {
      artistId,
      status:  { in: ['PENDING', 'CONFIRMED'] },
      startAt: { lt: to },
      endAt:   { gt: from },
    },
    select: {
      startAt: true,
      endAt:   true,
    },
  })

  // 5. Buscar AvailabilityBlocks no período
  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      artistId,
      startAt: { lt: to },
      endAt:   { gt: from },
    },
    select: {
      startAt: true,
      endAt:   true,
    },
  })

  // 6. Filtrar conflitos — combina appointments e blocks como intervalos ocupados
  const occupied = [...appointments, ...blocks]
  const freeSlots = filterConflicts(allSlots, occupied)

  // 7. Retornar resultado — sem nenhum dado de Appointment
  return {
    artistId: artist.id,
    timezone: artist.timezone,
    slots:    freeSlots,
  }
}

// ── createPublicAppointment ───────────────────────────────────────────────────

/**
 * Cria um Appointment público com validação de antecedência, idempotência
 * e revalidação de conflito dentro de uma transaction Prisma.
 *
 * Fluxo:
 * 1. Validar antecedência (24h mínimo, 60 dias máximo)
 * 2. Verificar idempotência por (artistId, startAt, requesterEmail)
 *    — se existir com PENDING ou CONFIRMED, retornar existente (HTTP 200)
 * 3. Executar prisma.$transaction com revalidação de conflito antes do INSERT
 * 4. Retornar Appointment com requestCode
 *
 * @param artistId - UUID do artista
 * @param data     - Dados da solicitação (validados pelo schema Zod)
 * @returns        - { appointment, isIdempotent } onde isIdempotent=true indica HTTP 200
 *
 * @throws PublicSchedulingError com code 'NOT_FOUND'         se o artista não existir
 * @throws PublicSchedulingError com code 'ADVANCE_TOO_SHORT' se startAt < now + 24h
 * @throws PublicSchedulingError com code 'ADVANCE_TOO_LONG'  se startAt > now + 60 dias
 * @throws PublicSchedulingError com code 'CONFLICT'          se houver conflito no momento do commit
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9, 4.10, 8.4
 */
export async function createPublicAppointment(
  artistId: string,
  data:     PublicCreateAppointmentBody,
): Promise<{ appointment: PublicAppointmentStatusResult & { requestCode: string }; isIdempotent: boolean }> {
  const startAt = new Date(data.startAt)
  const endAt   = new Date(data.endAt)
  const now     = Date.now()

  // 1. Validar antecedência mínima (24h)
  if (startAt.getTime() < now + MIN_ADVANCE_MS) {
    throw new PublicSchedulingError(
      'ADVANCE_TOO_SHORT',
      'startAt deve ser pelo menos 24 horas no futuro',
    )
  }

  // 1. Validar antecedência máxima (60 dias)
  if (startAt.getTime() > now + MAX_ADVANCE_MS) {
    throw new PublicSchedulingError(
      'ADVANCE_TOO_LONG',
      'startAt deve ser no máximo 60 dias no futuro',
    )
  }

  // Verificar que o artista existe e buscar timezone + regras
  const artist = await prisma.artist.findUnique({
    where:  { id: artistId },
    select: { id: true, timezone: true },
  })

  if (!artist) {
    throw new PublicSchedulingError('NOT_FOUND', 'Artista não encontrado')
  }

  // 2. Verificar idempotência por (artistId, startAt, requesterEmail)
  // Feito antes da validação de slot para evitar reprocessamento desnecessário
  const existing = await prisma.appointment.findFirst({
    where: {
      artistId,
      startAt,
      requesterEmail: data.requesterEmail,
      status:         { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      requestCode: true,
      status:      true,
      startAt:     true,
      endAt:       true,
    },
  })

  if (existing) {
    return {
      appointment: {
        requestCode: existing.requestCode,
        status:      existing.status as PublicAppointmentStatusResult['status'],
        startAt:     existing.startAt,
        endAt:       existing.endAt,
      },
      isIdempotent: true,
    }
  }

  // Validar que o horário solicitado pertence a um slot disponível
  const rules = await prisma.availabilityRule.findMany({
    where:  { artistId, active: true },
    select: { weekday: true, startTime: true, endTime: true, slotMinutes: true, active: true },
  })
  if (rules.length > 0) {
    const possibleSlots = generateSlots(rules, startAt, startAt, artist.timezone)
    const slotExists = possibleSlots.some(
      (s) => s.startAt.getTime() === startAt.getTime() && s.endAt.getTime() === endAt.getTime(),
    )
    if (!slotExists) {
      throw new PublicSchedulingError(
        'CONFLICT',
        'O horário solicitado não corresponde a um slot disponível do artista',
      )
    }
  }

  // Validar ownership do serviceId (se fornecido)
  if (data.serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, artistId, active: true },
      select: { id: true },
    })
    if (!service) {
      throw new PublicSchedulingError('NOT_FOUND', 'Serviço não encontrado para este artista')
    }
  }

  // 3. Executar transaction com revalidação de conflito antes do INSERT
  // Usa isolationLevel Serializable para prevenir race conditions
  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Revalidar conflito dentro da transaction
    const conflicts = await findConflicts(artistId, startAt, endAt, tx)

    if (conflicts.length > 0) {
      throw new PublicSchedulingError(
        'CONFLICT',
        'O horário solicitado não está mais disponível',
      )
    }

    // Verificar conflito com AvailabilityBlocks dentro da transaction
    const blockConflicts = await tx.availabilityBlock.findMany({
      where: {
        artistId,
        startAt: { lt: endAt },
        endAt:   { gt: startAt },
      },
      select: { id: true },
    })

    if (blockConflicts.length > 0) {
      throw new PublicSchedulingError(
        'CONFLICT',
        'O horário solicitado está bloqueado pelo artista',
      )
    }

    // INSERT do Appointment
    return tx.appointment.create({
      data: {
        artistId,
        requesterName:  data.requesterName,
        requesterEmail: data.requesterEmail,
        requesterPhone: data.requesterPhone,
        serviceId:      data.serviceId,
        startAt,
        endAt,
        notes:          data.notes,
        status:         'PENDING',
      },
      select: {
        requestCode: true,
        status:      true,
        startAt:     true,
        endAt:       true,
      },
    })
  }, { isolationLevel: 'Serializable' })

  // 4. Retornar Appointment com requestCode
  return {
    appointment: {
      requestCode: created.requestCode,
      status:      created.status as PublicAppointmentStatusResult['status'],
      startAt:     created.startAt,
      endAt:       created.endAt,
    },
    isIdempotent: false,
  }
}

// ── getAppointmentByRequestCode ───────────────────────────────────────────────

/**
 * Retorna apenas os campos públicos de um Appointment pelo requestCode.
 * Nunca expõe: requesterName, requesterEmail, requesterPhone, artistId, notes.
 *
 * @param requestCode - UUID único do Appointment
 * @returns           - Campos públicos do Appointment
 *
 * @throws PublicSchedulingError com code 'NOT_FOUND' se o requestCode não existir
 *
 * Requirements: 5.2, 5.3, 9.2
 */
export async function getAppointmentByRequestCode(
  requestCode: string,
): Promise<PublicAppointmentStatusResult> {
  const appointment = await prisma.appointment.findUnique({
    where:  { requestCode },
    select: {
      requestCode: true,
      status:      true,
      startAt:     true,
      endAt:       true,
      // Campos sensíveis NUNCA selecionados:
      // requesterName, requesterEmail, requesterPhone, artistId, notes
    },
  })

  if (!appointment) {
    throw new PublicSchedulingError('NOT_FOUND', 'Solicitação não encontrada')
  }

  return {
    requestCode: appointment.requestCode,
    status:      appointment.status as PublicAppointmentStatusResult['status'],
    startAt:     appointment.startAt,
    endAt:       appointment.endAt,
  }
}
