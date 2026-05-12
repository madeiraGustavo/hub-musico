import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  getAppointmentsHandler,
  updateStatusHandler,
  deleteAppointmentHandler,
} from './appointments.controller.js'

export async function appointmentsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/appointments',              { preHandler: authenticate }, getAppointmentsHandler)
  fastify.patch('/appointments/:id/status', { preHandler: authenticate }, updateStatusHandler as RouteHandlerMethod)
  fastify.delete('/appointments/:id',       { preHandler: authenticate }, deleteAppointmentHandler as RouteHandlerMethod)
}
