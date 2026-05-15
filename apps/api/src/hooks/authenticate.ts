/**
 * authenticate.ts
 *
 * preHandler equivalente ao requireAuth() do apps/web.
 * Regra de ouro: artist_id e siteId vêm do banco via Prisma — nunca do token JWT.
 *
 * Multi-tenant: valida que o user pertence ao site da request.
 * Admin bypassa isolamento de site (cross-site access).
 *
 * Uso:
 *   fastify.get('/rota', { preHandler: authenticate }, handler)
 *   // ou com roles específicos:
 *   fastify.get('/rota', { preHandler: authenticateRoles(['admin', 'artist']) }, handler)
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma.js'
import type { UserRole } from '@prisma/client'
import { resolveSiteFromRequest } from '../lib/sites.js'

/**
 * Hook de autenticação padrão — aceita qualquer role válido.
 */
export async function authenticate(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  return authenticateRoles(['admin', 'artist', 'editor', 'client'])(request, reply)
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

    const payload = request.user as unknown as { sub: string }

    if (!payload?.sub) {
      return reply.code(401).send({ error: 'Não autorizado' })
    }

    // 2. Busca role, siteId e artist_id do banco — nunca do token
    const userData = await prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { role: true, siteId: true, artistId: true },
    })

    if (!userData) {
      return reply.code(403).send({ error: 'Usuário não encontrado' })
    }

    // 3. Verifica role
    if (!allowedRoles.includes(userData.role)) {
      return reply.code(403).send({ error: 'Permissão insuficiente' })
    }

    // 4. Validação de site — admin bypassa isolamento
    if (userData.role !== 'admin') {
      const requestSite = resolveSiteFromRequest(request)
      if (userData.siteId !== requestSite.id) {
        return reply.code(403).send({ error: 'Acesso negado: site incorreto' })
      }
    }

    // 5. Artist/editor precisam de artist_id (client e admin não)
    if ((userData.role === 'artist' || userData.role === 'editor') && !userData.artistId) {
      return reply.code(403).send({ error: 'Perfil de artista não configurado' })
    }

    // 6. Injeta AuthContext em request.user
    request.user = {
      userId:   payload.sub,
      artistId: userData.artistId ?? '',
      role:     userData.role,
      siteId:   userData.siteId,
    }
  }
}
