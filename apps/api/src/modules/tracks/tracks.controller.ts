import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateTrackSchema, UpdateTrackSchema } from './tracks.schema.js'
import { findAllByArtist, findById, create, update, remove } from './tracks.repository.js'
import type { AuthContext } from '../../types/fastify.js'

// ── GET /dashboard/tracks ─────────────────────────────────────────────────────

/**
 * Retorna todas as tracks do artista autenticado, ordenadas por sort_order.
 */
export async function getTracksHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const tracks = await findAllByArtist(artistId)

  return reply.code(200).send({ data: tracks })
}

// ── POST /dashboard/tracks ────────────────────────────────────────────────────

/**
 * Cria uma nova track para o artista autenticado.
 * O artistId vem sempre do AuthContext — nunca do body.
 */
export async function createTrackHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateTrackSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const track = await create(artistId, parsed.data)

  return reply.code(201).send({ data: track })
}

// ── PATCH /dashboard/tracks/:id ───────────────────────────────────────────────

/**
 * Atualiza uma track do artista autenticado.
 *
 * Ownership:
 * - Verifica que a track pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor pode atualizar tracks do próprio artista (sem restrição de campos)
 */
export async function updateTrackHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  const track = await findById(id)
  if (!track) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && track.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateTrackSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? track.artistId : artistId

  const updated = await update(id, ownerArtistId, parsed.data)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/tracks/:id ──────────────────────────────────────────────

/**
 * Remove uma track do artista autenticado.
 *
 * Ownership:
 * - Verifica que a track pertence ao artista autenticado
 * - Admin bypassa a verificação de ownership
 * - Editor não pode deletar tracks (403)
 */
export async function deleteTrackHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext
  const { id } = request.params

  // Editor não tem permissão para deletar
  if (role === 'editor') {
    return reply.code(403).send({ error: 'Permissão insuficiente' })
  }

  const track = await findById(id)
  if (!track) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  // Verifica ownership — admin bypassa
  if (role !== 'admin' && track.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // Para admin, usa o artistId do recurso; para outros, usa o do AuthContext
  const ownerArtistId = role === 'admin' ? track.artistId : artistId

  await remove(id, ownerArtistId)

  return reply.code(204).send()
}
