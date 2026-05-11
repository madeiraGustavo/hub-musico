import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { getProjectsHandler, createProjectHandler, updateProjectHandler, deleteProjectHandler } from './projects.controller.js'

export async function projectsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard/projects',         { preHandler: authenticate }, getProjectsHandler)
  fastify.post('/dashboard/projects',        { preHandler: authenticate }, createProjectHandler)
  fastify.patch('/dashboard/projects/:id',   { preHandler: authenticate }, updateProjectHandler as RouteHandlerMethod)
  fastify.delete('/dashboard/projects/:id',  { preHandler: authenticate }, deleteProjectHandler as RouteHandlerMethod)
}
