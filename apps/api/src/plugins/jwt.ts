import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import type { FastifyInstance } from 'fastify'
import { env } from '../env.js'

export default fp(async function jwtPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCookie)

  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '15m' },
  })
})
