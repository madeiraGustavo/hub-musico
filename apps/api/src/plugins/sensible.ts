import fp from 'fastify-plugin'
import fastifySensible from '@fastify/sensible'
import type { FastifyInstance } from 'fastify'

export default fp(async function sensiblePlugin(fastify: FastifyInstance) {
  await fastify.register(fastifySensible)
})
