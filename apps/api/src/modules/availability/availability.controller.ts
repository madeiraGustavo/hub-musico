import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  CreateAvailabilityRuleSchema,
  UpdateAvailabilityRuleSchema,
  CreateAvailabilityBlockSchema,
  UpdateAvailabilityBlockSchema,
} from './availability.schemas.js'
import {
  findRulesByArtist,
  findRuleById,
  createRule,
  updateRule,
  deleteRule,
  findBlocksByArtist,
  findBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
} from './availability.repository.js'
import type { AuthContext } from '../../types/fastify.js'

// ── GET /availability-rules ───────────────────────────────────────────────────

/**
 * Retorna todas as regras de disponibilidade do artista autenticado,
 * ordenadas por weekday e startTime.
 */
export async function getRulesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const rules = await findRulesByArtist(artistId)

  return reply.code(200).send({ data: rules })
}

// ── POST /availability-rules ──────────────────────────────────────────────────

/**
 * Cria uma nova regra de disponibilidade para o artista autenticado.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function createRuleHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateAvailabilityRuleSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const rule = await createRule(artistId, parsed.data)

  return reply.code(201).send({ data: rule })
}

// ── PATCH /availability-rules/:id ─────────────────────────────────────────────

/**
 * Atualiza uma regra de disponibilidade do artista autenticado.
 * Verifica ownership antes de aplicar a modificação.
 * Retorna 403 se a regra não pertencer ao artista autenticado.
 */
export async function updateRuleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const rule = await findRuleById(id)
  if (!rule) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (rule.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateAvailabilityRuleSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Validar estado final: se apenas startTime ou endTime foi enviado,
  // buscar o valor atual e verificar que startTime < endTime no resultado final
  if (parsed.data.startTime !== undefined || parsed.data.endTime !== undefined) {
    const currentRule = await findRulesByArtist(artistId).then(
      (rules) => rules.find((r) => r.id === id),
    )
    if (currentRule) {
      const finalStartTime = parsed.data.startTime ?? currentRule.startTime
      const finalEndTime   = parsed.data.endTime ?? currentRule.endTime
      if (finalStartTime >= finalEndTime) {
        return reply.code(422).send({
          error: 'startTime deve ser anterior a endTime',
        })
      }
    }
  }

  const updated = await updateRule(id, artistId, parsed.data)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /availability-rules/:id ────────────────────────────────────────────

/**
 * Remove uma regra de disponibilidade do artista autenticado.
 * Verifica ownership antes de remover.
 * Retorna 403 se a regra não pertencer ao artista autenticado.
 */
export async function deleteRuleHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const rule = await findRuleById(id)
  if (!rule) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (rule.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  await deleteRule(id, artistId)

  return reply.code(204).send()
}

// ── GET /availability-blocks ──────────────────────────────────────────────────

/**
 * Retorna todos os bloqueios de agenda do artista autenticado,
 * ordenados por startAt.
 */
export async function getBlocksHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const blocks = await findBlocksByArtist(artistId)

  return reply.code(200).send({ data: blocks })
}

// ── POST /availability-blocks ─────────────────────────────────────────────────

/**
 * Cria um novo bloqueio de agenda para o artista autenticado.
 * O artistId vem sempre do AuthContext — nunca do body da requisição.
 */
export async function createBlockHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateAvailabilityBlockSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const block = await createBlock(artistId, parsed.data)

  return reply.code(201).send({ data: block })
}

// ── PATCH /availability-blocks/:id ────────────────────────────────────────────

/**
 * Atualiza um bloqueio de agenda do artista autenticado.
 * Verifica ownership antes de aplicar a modificação.
 * Retorna 403 se o bloqueio não pertencer ao artista autenticado.
 */
export async function updateBlockHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const block = await findBlockById(id)
  if (!block) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (block.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateAvailabilityBlockSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error:   'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Validar estado final: se apenas startAt ou endAt foi enviado,
  // buscar o valor atual e verificar que startAt < endAt no resultado final
  if (parsed.data.startAt !== undefined || parsed.data.endAt !== undefined) {
    const currentBlock = await findBlocksByArtist(artistId).then(
      (blocks) => blocks.find((b) => b.id === id),
    )
    if (currentBlock) {
      const finalStartAt = parsed.data.startAt ? new Date(parsed.data.startAt) : currentBlock.startAt
      const finalEndAt   = parsed.data.endAt ? new Date(parsed.data.endAt) : currentBlock.endAt
      if (finalStartAt >= finalEndAt) {
        return reply.code(422).send({
          error: 'startAt deve ser anterior a endAt',
        })
      }
    }
  }

  const updated = await updateBlock(id, artistId, parsed.data)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /availability-blocks/:id ───────────────────────────────────────────

/**
 * Remove um bloqueio de agenda do artista autenticado.
 * Verifica ownership antes de remover.
 * Retorna 403 se o bloqueio não pertencer ao artista autenticado.
 */
export async function deleteBlockHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const block = await findBlockById(id)
  if (!block) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (block.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  await deleteBlock(id, artistId)

  return reply.code(204).send()
}
