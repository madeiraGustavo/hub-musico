import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateOrderSchema, UpdateOrderStatusSchema, ListOrdersQuerySchema } from './marketplace-orders.schemas.js'
import { validateOrderStatusTransition, calculateOrderTotal } from './marketplace-orders.service.js'
import * as repo from './marketplace-orders.repository.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthContext } from '../../types/fastify.js'

// ── POST /marketplace/orders (público, rate limited) ──────────────────────────

export async function createOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = CreateOrderSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const { items, customerName, customerEmail, customerPhone } = parsed.data

  // Fetch all referenced products
  const productIds = items.map((i) => i.productId)
  const products = await prisma.marketplaceProduct.findMany({
    where: { id: { in: productIds } },
    select: { id: true, artistId: true, active: true, type: true, basePrice: true, stock: true, title: true },
  })

  // Validate all products exist and are active FIXED_PRICE
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product || !product.active || product.type !== 'FIXED_PRICE') {
      return reply.code(422).send({
        error: `Produto não encontrado, inativo ou não disponível para compra direta`,
      })
    }
  }

  // Validate all products belong to the same artist
  const artistIds = [...new Set(products.map((p) => p.artistId))]
  if (artistIds.length > 1) {
    return reply.code(422).send({
      error: 'Todos os itens devem pertencer ao mesmo artista',
    })
  }

  // Validate stock
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!
    if (product.stock !== null && item.quantity > product.stock) {
      return reply.code(422).send({
        error: `Quantidade excede o estoque disponível para ${product.title}`,
      })
    }
  }

  // Calculate total server-side
  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(product.basePrice),
    }
  })

  const total = calculateOrderTotal(orderItems)

  const order = await repo.create({
    artistId: artistIds[0],
    customerName,
    customerEmail,
    customerPhone,
    total,
    items: orderItems,
  })

  return reply.code(201).send({
    data: { orderId: order.id, status: order.status, total: Number(order.total) },
  })
}

// ── GET /dashboard/marketplace/orders ─────────────────────────────────────────

export async function listOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = ListOrdersQuerySchema.safeParse(request.query)
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

// ── PATCH /dashboard/marketplace/orders/:id/status ────────────────────────────

export async function updateOrderStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const order = await repo.findById(id)
  if (!order) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (order.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateOrderStatusSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  if (!validateOrderStatusTransition(order.status, parsed.data.status)) {
    return reply.code(422).send({
      error: `Transição de status inválida: ${order.status} → ${parsed.data.status}`,
    })
  }

  const updated = await repo.updateStatus(id, parsed.data.status)

  return reply.code(200).send({ data: updated })
}
