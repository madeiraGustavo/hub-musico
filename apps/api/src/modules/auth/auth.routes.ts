import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../hooks/authenticate.js'
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  sessionHandler,
} from './auth.controller.js'

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Rotas públicas — sem autenticação
  fastify.post('/auth/login',   loginHandler)
  fastify.post('/auth/refresh', refreshHandler)

  // Rotas protegidas — requerem Bearer JWT válido
  fastify.post('/auth/logout',  { preHandler: authenticate }, logoutHandler)
  fastify.get('/auth/session',  { preHandler: authenticate }, sessionHandler)
}
