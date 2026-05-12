import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  getRulesHandler,
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
  getBlocksHandler,
  createBlockHandler,
  updateBlockHandler,
  deleteBlockHandler,
} from './availability.controller.js'

export async function availabilityRoutes(fastify: FastifyInstance): Promise<void> {
  // ── Availability Rules ──────────────────────────────────────────────────────
  fastify.get('/availability-rules',        { preHandler: authenticate }, getRulesHandler)
  fastify.post('/availability-rules',       { preHandler: authenticate }, createRuleHandler)
  fastify.patch('/availability-rules/:id',  { preHandler: authenticate }, updateRuleHandler as RouteHandlerMethod)
  fastify.delete('/availability-rules/:id', { preHandler: authenticate }, deleteRuleHandler as RouteHandlerMethod)

  // ── Availability Blocks ─────────────────────────────────────────────────────
  fastify.get('/availability-blocks',        { preHandler: authenticate }, getBlocksHandler)
  fastify.post('/availability-blocks',       { preHandler: authenticate }, createBlockHandler)
  fastify.patch('/availability-blocks/:id',  { preHandler: authenticate }, updateBlockHandler as RouteHandlerMethod)
  fastify.delete('/availability-blocks/:id', { preHandler: authenticate }, deleteBlockHandler as RouteHandlerMethod)
}
