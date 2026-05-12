import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  getPublicAvailabilityHandler,
  createPublicAppointmentHandler,
  getPublicAppointmentStatusHandler,
} from './public-scheduling.controller.js'

/**
 * Rotas públicas do sistema de agendamento — sem autenticação.
 *
 * Requirements: 3.1, 4.1, 4.8, 5.1
 */
export async function publicSchedulingRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /public/artists/:artistId/availability
  // Consulta pública de slots disponíveis — Requirement 3.1
  fastify.get(
    '/public/artists/:artistId/availability',
    getPublicAvailabilityHandler as RouteHandlerMethod,
  )

  // POST /public/artists/:artistId/appointments
  // Solicitação pública de agendamento — Requirements 4.1, 4.8
  // Rate limit mais restritivo: 5 req/min por IP (vs. 60 req/min padrão)
  fastify.post(
    '/public/artists/:artistId/appointments',
    {
      config: {
        rateLimit: {
          max:        5,
          timeWindow: '1 minute',
        },
      },
    },
    createPublicAppointmentHandler as RouteHandlerMethod,
  )

  // GET /public/appointments/:requestCode
  // Consulta pública de status de solicitação — Requirement 5.1
  fastify.get(
    '/public/appointments/:requestCode',
    getPublicAppointmentStatusHandler as RouteHandlerMethod,
  )
}
