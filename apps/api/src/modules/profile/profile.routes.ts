import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { getProfileHandler, updateProfileHandler } from './profile.controller.js'

export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard/profile',   { preHandler: authenticate }, getProfileHandler)
  fastify.patch('/dashboard/profile', { preHandler: authenticate }, updateProfileHandler)
}
