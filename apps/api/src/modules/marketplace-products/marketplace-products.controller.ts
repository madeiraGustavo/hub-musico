import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsQuerySchema,
  PublicListProductsQuerySchema,
} from './marketplace-products.schemas.js'
import { generateProductSlug, sanitizeText, validateProductType } from './marketplace-products.service.js'
import * as repo from './marketplace-products.repository.js'
import { prisma } from '../../lib/prisma.js'
import type { AuthContext } from '../../types/fastify.js'

// ── POST /dashboard/marketplace/products ──────────────────────────────────────

export async function createProductHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateProductSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const { type, basePrice, categoryId } = parsed.data

  // Validate type/price rule
  const typeError = validateProductType(type, basePrice)
  if (typeError) {
    return reply.code(422).send({ error: typeError })
  }

  // Verify categoryId belongs to the artist
  const category = await prisma.marketplaceCategory.findFirst({
    where: { id: categoryId, artistId },
    select: { id: true },
  })
  if (!category) {
    return reply.code(422).send({ error: 'Categoria não encontrada ou não pertence ao artista' })
  }

  // Generate unique slug
  const slug = await generateProductSlug(artistId, parsed.data.title)

  // Sanitize text fields
  const title = sanitizeText(parsed.data.title)
  const description = parsed.data.description ? sanitizeText(parsed.data.description) : undefined
  const shortDescription = parsed.data.shortDescription ? sanitizeText(parsed.data.shortDescription) : undefined

  const product = await repo.create(artistId, {
    title,
    slug,
    description,
    shortDescription,
    type: parsed.data.type,
    basePrice: parsed.data.basePrice,
    active: parsed.data.active,
    featured: parsed.data.featured,
    customizable: parsed.data.customizable,
    stock: parsed.data.stock,
    widthCm: parsed.data.widthCm,
    heightCm: parsed.data.heightCm,
    material: parsed.data.material,
    color: parsed.data.color,
    categoryId: parsed.data.categoryId,
    sortOrder: parsed.data.sortOrder,
  })

  return reply.code(201).send({ data: product })
}

// ── GET /dashboard/marketplace/products ───────────────────────────────────────

export async function listProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = ListProductsQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros de paginação inválidos',
      details: parsed.error.flatten(),
    })
  }

  const result = await repo.findAllByArtist(artistId, parsed.data.page, parsed.data.pageSize)

  return reply.code(200).send({ data: result.data, meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages } })
}

// ── GET /dashboard/marketplace/products/:id ───────────────────────────────────

export async function getProductHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  return reply.code(200).send({ data: product })
}

// ── PATCH /dashboard/marketplace/products/:id ─────────────────────────────────

export async function updateProductHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateProductSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  // Determine effective type and price for validation
  const effectiveType = parsed.data.type ?? product.type
  const effectivePrice = parsed.data.basePrice !== undefined
    ? parsed.data.basePrice
    : product.basePrice ? Number(product.basePrice) : null

  const typeError = validateProductType(effectiveType, effectivePrice)
  if (typeError) {
    return reply.code(422).send({ error: typeError })
  }

  // If categoryId is being changed, verify ownership
  if (parsed.data.categoryId) {
    const category = await prisma.marketplaceCategory.findFirst({
      where: { id: parsed.data.categoryId, artistId },
      select: { id: true },
    })
    if (!category) {
      return reply.code(422).send({ error: 'Categoria não encontrada ou não pertence ao artista' })
    }
  }

  // Build update data with sanitization
  const updateData: Record<string, unknown> = {}

  if (parsed.data.title !== undefined) {
    updateData.title = sanitizeText(parsed.data.title)
  }
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description ? sanitizeText(parsed.data.description) : parsed.data.description
  }
  if (parsed.data.shortDescription !== undefined) {
    updateData.shortDescription = parsed.data.shortDescription ? sanitizeText(parsed.data.shortDescription) : parsed.data.shortDescription
  }
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type
  if (parsed.data.basePrice !== undefined) updateData.basePrice = parsed.data.basePrice
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active
  if (parsed.data.featured !== undefined) updateData.featured = parsed.data.featured
  if (parsed.data.customizable !== undefined) updateData.customizable = parsed.data.customizable
  if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock
  if (parsed.data.widthCm !== undefined) updateData.widthCm = parsed.data.widthCm
  if (parsed.data.heightCm !== undefined) updateData.heightCm = parsed.data.heightCm
  if (parsed.data.material !== undefined) updateData.material = parsed.data.material
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder

  const updated = await repo.update(id, updateData)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/marketplace/products/:id ────────────────────────────────

export async function deleteProductHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // TODO: Remove images from Storage (will be implemented in task 9.1)

  await repo.remove(id)

  return reply.code(204).send()
}

// ── GET /marketplace/products (público) ───────────────────────────────────────

export async function listPublicProductsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = PublicListProductsQuerySchema.safeParse(request.query)
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'Parâmetros inválidos',
      details: parsed.error.flatten(),
    })
  }

  const result = await repo.findPublicProducts(parsed.data)

  // Transform data: truncate description, add thumbnailUrl
  const transformedData = result.data.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ? p.description.slice(0, 200) : null,
    price: p.basePrice ? Number(p.basePrice) : null,
    categoryId: p.categoryId,
    featured: p.featured,
    sortOrder: p.sortOrder,
    thumbnailUrl: p.images[0]?.url ?? null,
    createdAt: p.createdAt,
  }))

  return reply.code(200).send({
    data: transformedData,
    meta: { total: result.total, page: result.page, pageSize: result.pageSize, totalPages: result.totalPages },
  })
}

// ── GET /marketplace/products/:slug (público) ─────────────────────────────────

export async function getPublicProductHandler(
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { slug } = request.params

  const product = await repo.findPublicBySlug(slug)
  if (!product) {
    return reply.code(404).send({ error: 'Produto não encontrado' })
  }

  return reply.code(200).send({ data: product })
}
