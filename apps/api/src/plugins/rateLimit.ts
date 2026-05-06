import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    max: 10,
    timeWindow: '1 minute',
  })
})
