import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateQuoteSchema, UpdateQuoteStatusSchema, ListQuotesQuerySchema } from './marketplace-quotes.schemas.js'
import { validateQuoteStatusTransition, sanitizeText } from './marketplace-quotes.service.js'
import * as repo from './marketplace-quotes.repository.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthContext } from '../../types/fastify.js'

// ── POST /marketplace/quotes (público, rate limited) ──────────────────────────

export async function createQuoteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = CreateQuoteSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Verify product is active
  const product = await prisma.marketplaceProduct.findFirst({
    where: { id: parsed.data.productId, active: true },
    select: { id: true, artistId: true },
  })

  if (!product) {
    return reply.code(422).send({ error: 'Produto não encontrado ou inativo' })
  }

  // Sanitize message
  const message = sanitizeText(parsed.data.message)

  const quote = await repo.create({
    artistId: product.artistId,
    productId: parsed.data.productId,
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterPhone: parsed.data.requesterPhone,
    message,
    widthCm: parsed.data.widthCm,
    heightCm: parsed.data.heightCm,
    quantity: parsed.data.quantity,
  })

  return reply.code(201).send({ data: quote })
}

// ── GET /dashboard/marketplace/quotes ─────────────────────────────────────────

export async function listQuotesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = ListQuotesQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Parâmetros inválidos',
      details: parsed.error.flatten(),
    })
  }

  const result = await repo.findAllByArtist(artistId, parsed.data.page, parsed.data.pageSize, parsed.data.status)

  return reply.code(200).send({
    data: result.data,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages },
  })
}

// ── PATCH /dashboard/marketplace/quotes/:id/status ────────────────────────────

export async function updateQuoteStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const quote = await repo.findById(id)
  if (!quote) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (quote.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateQuoteStatusSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Validate status transition
  if (!validateQuoteStatusTransition(quote.status, parsed.data.status)) {
    return reply.code(422).send({
      error: `Transição de status inválida: ${quote.status} → ${parsed.data.status}`,
    })
  }

  // ANSWERED requires responseMessage
  if (parsed.data.status === 'ANSWERED' && !parsed.data.responseMessage) {
    return reply.code(422).send({
      error: 'Mensagem de resposta é obrigatória ao responder orçamento',
    })
  }

  const updated = await repo.updateStatus(id, parsed.data.status, parsed.data.responseMessage)

  return reply.code(200).send({ data: updated })
}
