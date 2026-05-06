import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import { uploadHandler } from './upload.controller.js'

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/upload', { preHandler: authenticate }, uploadHandler)
}
