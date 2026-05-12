/**
 * public-scheduling.controller.ts
 *
 * Handlers HTTP para os três endpoints públicos de agendamento.
 * Nenhum handler exige autenticação — são endpoints públicos.
 * Nenhum handler expõe campos de PII de terceiros na resposta.
 *
 * Requirements: 3.1, 4.1, 5.1, 9.1, 9.2
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  PublicAvailabilityQuerySchema,
  PublicCreateAppointmentSchema,
} from './public-scheduling.schemas.js'
import {
  getPublicAvailability,
  createPublicAppointment,
  getAppointmentByRequestCode,
  PublicSchedulingError,
} from './public-scheduling.service.js'

// ── GET /public/artists/:artistId/availability?from=&to= ──────────────────────

/**
 * Retorna os slots livres de um artista para o período [from, to].
 * Sem autenticação. Nunca retorna dados de Appointments.
 *
 * Requirements: 3.1, 3.6, 8.5, 9.1
 */
export async function getPublicAvailabilityHandler(
  request: FastifyRequest<{ Params: { artistId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.params

  const parsed = PublicAvailabilityQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const { from, to } = parsed.data
  const fromDate = new Date(from)
  const toDate   = new Date(to)

  try {
    const result = await getPublicAvailability(artistId, fromDate, toDate)

    // Retorna apenas { artistId, timezone, slots } — nunca dados de Appointments
    return reply.code(200).send({
      artistId: result.artistId,
      timezone: result.timezone,
      slots:    result.slots,
    })
  } catch (err) {
    if (err instanceof PublicSchedulingError && err.code === 'NOT_FOUND') {
      return reply.code(404).send({ error: err.message })
    }
    throw err
  }
}

// ── POST /public/artists/:artistId/appointments ───────────────────────────────

/**
 * Cria uma solicitação de agendamento pública.
 * Sem autenticação. Retorna 201 para criação nova, 200 para idempotência.
 * Mapeia erros do PublicSchedulingError para os códigos HTTP corretos.
 *
 * Requirements: 4.1, 4.3, 4.5, 4.6, 4.7, 4.9, 4.10
 */
export async function createPublicAppointmentHandler(
  request: FastifyRequest<{ Params: { artistId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.params

  const parsed = PublicCreateAppointmentSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  try {
    const { appointment, isIdempotent } = await createPublicAppointment(artistId, parsed.data)

    const statusCode = isIdempotent ? 200 : 201

    // Retorna apenas campos públicos — nunca PII de terceiros
    return reply.code(statusCode).send({
      requestCode: appointment.requestCode,
      status:      appointment.status,
      startAt:     appointment.startAt,
      endAt:       appointment.endAt,
    })
  } catch (err) {
    if (err instanceof PublicSchedulingError) {
      switch (err.code) {
        case 'NOT_FOUND':
          return reply.code(404).send({ error: err.message })
        case 'CONFLICT':
          return reply.code(409).send({ error: err.message })
        case 'ADVANCE_TOO_SHORT':
        case 'ADVANCE_TOO_LONG':
          return reply.code(422).send({ error: err.message })
      }
    }
    throw err
  }
}

// ── GET /public/appointments/:requestCode ─────────────────────────────────────

/**
 * Retorna o status público de uma solicitação pelo requestCode.
 * Sem autenticação. Retorna APENAS { requestCode, status, startAt, endAt } — nunca PII.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 9.2
 */
export async function getPublicAppointmentStatusHandler(
  request: FastifyRequest<{ Params: { requestCode: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { requestCode } = request.params

  try {
    const appointment = await getAppointmentByRequestCode(requestCode)

    // Retorna apenas campos públicos — nunca: requesterName, requesterEmail,
    // requesterPhone, artistId, notes
    return reply.code(200).send({
      requestCode: appointment.requestCode,
      status:      appointment.status,
      startAt:     appointment.startAt,
      endAt:       appointment.endAt,
    })
  } catch (err) {
    if (err instanceof PublicSchedulingError && err.code === 'NOT_FOUND') {
      return reply.code(404).send({ error: err.message })
    }
    throw err
  }
}
