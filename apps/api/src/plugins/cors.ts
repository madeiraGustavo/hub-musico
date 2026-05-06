import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { env } from '../env.js'

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  const origins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())

  await fastify.register(fastifyCors, {
    origin: origins,
    credentials: true,
  })
})
