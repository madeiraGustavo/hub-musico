import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { getServicesHandler, createServiceHandler, updateServiceHandler, deleteServiceHandler } from './services.controller.js'

export async function servicesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard/services',        { preHandler: authenticate }, getServicesHandler)
  fastify.post('/dashboard/services',       { preHandler: authenticate }, createServiceHandler)
  fastify.patch('/dashboard/services/:id',  { preHandler: authenticate }, updateServiceHandler)
  fastify.delete('/dashboard/services/:id', { preHandler: authenticate }, deleteServiceHandler)
}
