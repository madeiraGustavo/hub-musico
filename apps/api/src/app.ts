import Fastify, { type FastifyInstance } from 'fastify'
import multipart      from '@fastify/multipart'
import sensiblePlugin  from './plugins/sensible.js'
import corsPlugin      from './plugins/cors.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import jwtPlugin       from './plugins/jwt.js'
import { authRoutes }     from './modules/auth/auth.routes.js'
import { profileRoutes }  from './modules/profile/profile.routes.js'
import { tracksRoutes }   from './modules/tracks/tracks.routes.js'
import { projectsRoutes } from './modules/projects/projects.routes.js'
import { servicesRoutes }         from './modules/services/services.routes.js'
import { uploadRoutes }           from './modules/upload/upload.routes.js'
import { availabilityRoutes }     from './modules/availability/availability.routes.js'
import { appointmentsRoutes }     from './modules/appointments/appointments.routes.js'
import { publicSchedulingRoutes } from './modules/public-scheduling/public-scheduling.routes.js'
import { marketplaceCategoriesRoutes } from './modules/marketplace-categories/marketplace-categories.routes.js'
import { marketplaceProductsRoutes } from './modules/marketplace-products/marketplace-products.routes.js'
import { marketplaceQuotesRoutes } from './modules/marketplace-quotes/marketplace-quotes.routes.js'
import { marketplaceOrdersRoutes } from './modules/marketplace-orders/marketplace-orders.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: true })

  // Plugins — ordem: sensible → cors → rateLimit → jwt → multipart
  await fastify.register(sensiblePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })

  // Rotas
  await fastify.register(authRoutes)
  await fastify.register(profileRoutes)
  await fastify.register(tracksRoutes)
  await fastify.register(projectsRoutes)
  await fastify.register(servicesRoutes)
  await fastify.register(uploadRoutes)
  await fastify.register(availabilityRoutes)
  await fastify.register(appointmentsRoutes)
  await fastify.register(publicSchedulingRoutes)
  await fastify.register(marketplaceCategoriesRoutes)
  await fastify.register(marketplaceProductsRoutes)
  await fastify.register(marketplaceQuotesRoutes)
  await fastify.register(marketplaceOrdersRoutes)

  return fastify
}

export type { FastifyInstance }
