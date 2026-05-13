import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  createQuoteHandler,
  listQuotesHandler,
  updateQuoteStatusHandler,
} from './marketplace-quotes.controller.js'

export async function marketplaceQuotesRoutes(fastify: FastifyInstance): Promise<void> {
  // Public (rate limited: 5 req / 15 min per IP)
  fastify.post('/marketplace/quotes', {
    config: {
      rateLimit: { max: 5, timeWindow: '15 minutes' },
    },
  }, createQuoteHandler)

  // Private (authenticated)
  fastify.get('/dashboard/marketplace/quotes', { preHandler: authenticate }, listQuotesHandler)
  fastify.patch('/dashboard/marketplace/quotes/:id/status', { preHandler: authenticate }, updateQuoteStatusHandler as RouteHandlerMethod)
}
