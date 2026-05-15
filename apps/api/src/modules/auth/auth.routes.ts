import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  sessionHandler,
} from './auth.controller.js'

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Rotas públicas — sem autenticação
  fastify.post('/auth/login',    loginHandler)
  fastify.post('/auth/register', registerHandler)
  fastify.post('/auth/refresh',  refreshHandler)

  // Rota pública — revogação via cookie refreshToken (access token pode ter expirado)
  fastify.post('/auth/logout',  logoutHandler)
  fastify.get('/auth/session',  { preHandler: authenticate }, sessionHandler)
}
