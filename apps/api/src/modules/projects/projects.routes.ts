import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { getProjectsHandler, createProjectHandler } from './projects.controller.js'

export async function projectsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard/projects',  { preHandler: authenticate }, getProjectsHandler)
  fastify.post('/dashboard/projects', { preHandler: authenticate }, createProjectHandler)
}
