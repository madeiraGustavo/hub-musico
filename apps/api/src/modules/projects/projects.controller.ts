import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateProjectSchema, UpdateProjectSchema } from './projects.schema.js'
import { findAllByArtist, findById, create, update, remove } from './projects.repository.js'
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

// ── PATCH /dashboard/projects/:id ─────────────────────────────────────────────

/**
 * Atualiza um projeto do artista autenticado.
 *
 * Ownership:
 * - Verifica que o projeto pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor pode atualizar projetos do próprio artista (sem restrição de campos)
 */
export async function updateProjectHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  const project = await findById(id)
  if (!project) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && project.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateProjectSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? project.artistId : artistId

  const updated = await update(id, ownerArtistId, parsed.data)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/projects/:id ────────────────────────────────────────────

/**
 * Remove um projeto do artista autenticado.
 *
 * Ownership:
 * - Verifica que o projeto pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor não pode deletar projetos (403)
 *
 * Regra de negócio:
 * - Apenas projetos com status 'draft' podem ser removidos
 * - Projetos 'active' ou 'archived' retornam 422
 */
export async function deleteProjectHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  // Editor não tem permissão para deletar
  if (role === 'editor') {
    return reply.code(403).send({ error: 'Permissão insuficiente' })
  }

  const project = await findById(id)
  if (!project) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && project.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // Apenas projetos em rascunho podem ser removidos
  if (project.status !== 'draft') {
    return reply.code(422).send({ error: 'Apenas projetos em rascunho podem ser removidos' })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? project.artistId : artistId

  await remove(id, ownerArtistId)

  return reply.code(204).send()
}
