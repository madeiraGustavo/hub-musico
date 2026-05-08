import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateServiceSchema, UpdateServiceSchema } from './services.schema.js'
import { findAllByArtist, findById, create, update, remove } from './services.repository.js'
import type { AuthContext } from '../../types/fastify.js'

// ── GET /dashboard/services ───────────────────────────────────────────────────

/**
 * Retorna todos os serviços do artista autenticado, ordenados por sort_order.
 */
export async function getServicesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const services = await findAllByArtist(artistId)

  return reply.code(200).send({ data: services })
}

// ── POST /dashboard/services ──────────────────────────────────────────────────

/**
 * Cria um novo serviço para o artista autenticado.
 * O artistId vem sempre do AuthContext — nunca do body.
 */
export async function createServiceHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateServiceSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const service = await create(artistId, parsed.data)

  return reply.code(201).send({ data: service })
}

// ── PATCH /dashboard/services/:id ─────────────────────────────────────────────

/**
 * Atualiza um serviço do artista autenticado.
 *
 * Ownership:
 * - Verifica que o serviço pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor pode atualizar serviços do próprio artista
 */
export async function updateServiceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  const service = await findById(id)
  if (!service) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && service.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateServiceSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? service.artistId : artistId

  const updated = await update(id, ownerArtistId, parsed.data)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/services/:id ────────────────────────────────────────────

/**
 * Remove um serviço do artista autenticado.
 *
 * Ownership:
 * - Verifica que o serviço pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor não pode deletar serviços (403)
 */
export async function deleteServiceHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  // Editor não tem permissão para deletar
  if (role === 'editor') {
    return reply.code(403).send({ error: 'Permissão insuficiente' })
  }

  const service = await findById(id)
  if (!service) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && service.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? service.artistId : artistId

  await remove(id, ownerArtistId)

  return reply.code(204).send()
}
