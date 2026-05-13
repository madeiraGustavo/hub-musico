import type { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  createOrderHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
} from './marketplace-orders.controller.js'

export async function marketplaceOrdersRoutes(fastify: FastifyInstance): Promise<void> {
  // Public (rate limited: 3 req / 15 min per IP)
  fastify.post('/marketplace/orders', {
    config: {
      rateLimit: { max: 3, timeWindow: '15 minutes' },
    },
  }, createOrderHandler)

  // Private (authenticated)
  fastify.get('/dashboard/marketplace/orders', { preHandler: authenticate }, listOrdersHandler)
  fastify.patch('/dashboard/marketplace/orders/:id/status', { preHandler: authenticate }, updateOrderStatusHandler as RouteHandlerMethod)
}
