/**
 * authenticate.ts
 *
 * preHandler equivalente ao requireAuth() do apps/web.
 * Regra de ouro: artist_id vem do banco via Prisma — nunca do token JWT.
 *
 * Uso:
 *   fastify.get('/rota', { preHandler: authenticate }, handler)
 *   // ou com roles específicos:
 *   fastify.get('/rota', { preHandler: authenticateRoles(['admin', 'artist']) }, handler)
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma.js'

type UserRole = 'admin' | 'artist' | 'editor'

interface UserRow {
  role:      UserRole
  artist_id: string | null
}

/**
 * Hook de autenticação padrão — aceita qualquer role válido.
 */
export async function authenticate(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  return authenticateRoles(['admin', 'artist', 'editor'])(request, reply)
}

/**
 * Factory que retorna um preHandler restrito a roles específicos.
 */
export function authenticateRoles(allowedRoles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // 1. Verifica e decodifica o Bearer token via @fastify/jwt
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: 'Não autorizado' })
    }

    const payload = request.user as unknown as { sub: string; role: string }

    if (!payload?.sub) {
      return reply.code(401).send({ error: 'Não autorizado' })
    }

    // 2. Busca role e artist_id do banco — nunca do token
    const userData = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { role: true, artistId: true },
    })

    if (!userData) {
      return reply.code(403).send({ error: 'Usuário não encontrado' })
    }

    // 3. Verifica role
    if (!allowedRoles.includes(userData.role as UserRole)) {
      return reply.code(403).send({ error: 'Permissão insuficiente' })
    }

    // 4. Admin não precisa de artist_id para todas as operações
    if (userData.role !== 'admin' && !userData.artistId) {
      return reply.code(403).send({ error: 'Perfil de artista não configurado' })
    }

    // 5. Injeta AuthContext em request.user
    request.user = {
      userId:   payload.sub,
      artistId: userData.artistId ?? '',
      role:     userData.role as UserRole,
    }
  }
}
