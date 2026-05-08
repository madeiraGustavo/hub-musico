import type { FastifyRequest, FastifyReply } from 'fastify'
import { UpdateProfileSchema } from './profile.schema.js'
import { findByArtistId, update } from './profile.repository.js'
import type { AuthContext } from '../../types/fastify.js'

/**
 * GET /dashboard/profile
 * Retorna o perfil completo do artista autenticado.
 */
export async function getProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const profile = await findByArtistId(artistId)

  if (!profile) {
    return reply.code(404).send({ error: 'Perfil não encontrado' })
  }

  return reply.code(200).send({ data: profile })
}

/**
 * PATCH /dashboard/profile
 * Atualiza o perfil do artista autenticado.
 *
 * Restrição de campos sensíveis:
 * - `email` e `whatsapp` só podem ser alterados por roles `artist` e `admin`
 * - `editor` recebe 403 se tentar alterar esses campos
 */
export async function updateProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId, role } = request.user as AuthContext

  const parsed = UpdateProfileSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const { email, whatsapp, ...safeFields } = parsed.data

  // Campos sensíveis — apenas artist e admin
  const hasSensitiveFields = email !== undefined || whatsapp !== undefined
  if (hasSensitiveFields && role === 'editor') {
    return reply.code(403).send({ error: 'Permissão insuficiente' })
  }

  const updateData =
    role === 'artist' || role === 'admin'
      ? { ...safeFields, ...(email !== undefined ? { email } : {}), ...(whatsapp !== undefined ? { whatsapp } : {}) }
      : safeFields

  const updated = await update(artistId, updateData)

  return reply.code(200).send({ data: updated })
}
