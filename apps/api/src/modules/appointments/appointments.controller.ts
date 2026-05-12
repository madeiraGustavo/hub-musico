import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  AppointmentQuerySchema,
  UpdateAppointmentStatusSchema,
} from './appointments.schemas.js'
import {
  findByArtistAndPeriod,
  findById,
  remove,
} from './appointments.repository.js'
import { updateStatus } from './appointments.service.js'
import type { AuthContext } from '../../types/fastify.js'
import type { AppointmentStatus } from '@prisma/client'

// ── Transições de status válidas ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING:   ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
  REJECTED:  [],
}

// ── GET /appointments?from&to ─────────────────────────────────────────────────

/**
 * Retorna o calendário completo do artista autenticado no período [from, to].
 * O artistId vem sempre do AuthContext — nunca de query string ou body.
 * Retorna 422 se o período exceder 60 dias.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export async function getAppointmentsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = AppointmentQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const { from, to } = parsed.data
  const fromDate = new Date(from)
  const toDate   = new Date(to)

  const appointments = await findByArtistAndPeriod(artistId, fromDate, toDate)

  return reply.code(200).send({ data: appointments })
}

// ── PATCH /appointments/:id/status ───────────────────────────────────────────

/**
 * Atualiza o status de um Appointment do artista autenticado.
 * Verifica ownership (403) e valida a transição de status (422).
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function updateStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const appointment = await findById(id)
  if (!appointment) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (appointment.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateAppointmentStatusSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const newStatus = parsed.data.status as AppointmentStatus
  const allowed   = VALID_TRANSITIONS[appointment.status]

  if (!allowed.includes(newStatus)) {
    return reply.code(422).send({
      error: `Transição de status inválida: ${appointment.status} → ${newStatus}`,
    })
  }

  const updated = await updateStatus(id, artistId, newStatus)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /appointments/:id ──────────────────────────────────────────────────

/**
 * Remove um Appointment do artista autenticado.
 * Verifica ownership antes de remover.
 * Retorna 403 se o Appointment não pertencer ao artista autenticado.
 *
 * Requirements: 7.6, 7.7
 */
export async function deleteAppointmentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const appointment = await findById(id)
  if (!appointment) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (appointment.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  await remove(id, artistId)

  return reply.code(204).send()
}
