import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateProjectSchema } from './projects.schema.js'
import { findAllByArtist, create } from './projects.repository.js'
import type { AuthContext } from '../../types/fastify.js'

// ── GET /dashboard/projects ───────────────────────────────────────────────────

/**
 * Retorna todos os projetos do artista autenticado, ordenados por sort_order.
 */
export async function getProjectsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const projects = await findAllByArtist(artistId)

  return reply.code(200).send({ data: projects })
}

// ── POST /dashboard/projects ──────────────────────────────────────────────────

/**
 * Cria um novo projeto para o artista autenticado.
 * O artistId vem sempre do AuthContext — nunca do body.
 */
export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateProjectSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const project = await create(artistId, parsed.data)

  return reply.code(201).send({ data: project })
}
