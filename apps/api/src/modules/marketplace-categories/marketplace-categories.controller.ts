import type { FastifyRequest, FastifyReply } from 'fastify'
import { CreateCategorySchema, UpdateCategorySchema } from './marketplace-categories.schemas.js'
import { generateSlug } from './marketplace-categories.service.js'
import * as repo from './marketplace-categories.repository.js'
import type { AuthContext } from '../../types/fastify.js'

// ── POST /dashboard/marketplace/categories ────────────────────────────────────

export async function createCategoryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const parsed = CreateCategorySchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const baseSlug = generateSlug(parsed.data.name)

  // Requirement 1.7: slug duplicado para o mesmo artista → 409
  const existingWithSlug = await repo.findByArtistAndSlug(artistId, baseSlug)
  if (existingWithSlug) {
    return reply.code(409).send({ error: 'Já existe uma categoria com este nome' })
  }

  const category = await repo.create(artistId, {
    name: parsed.data.name,
    slug: baseSlug,
    icon: parsed.data.icon,
    sortOrder: parsed.data.sortOrder,
  })

  return reply.code(201).send({ data: category })
}

// ── GET /dashboard/marketplace/categories ─────────────────────────────────────

export async function listCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext

  const categories = await repo.findAllByArtist(artistId)

  return reply.code(200).send({ data: categories })
}

// ── PATCH /dashboard/marketplace/categories/:id ───────────────────────────────

export async function updateCategoryHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const category = await repo.findById(id)
  if (!category) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (category.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const parsed = UpdateCategorySchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({
      error: 'Dados inválidos',
      details: parsed.error.flatten(),
    })
  }

  const updateData: { name?: string; slug?: string; icon?: string; sortOrder?: number } = {}

  if (parsed.data.name !== undefined) {
    const newSlug = generateSlug(parsed.data.name)
    // Check if slug conflicts with another category of the same artist
    const existingWithSlug = await repo.findByArtistAndSlug(artistId, newSlug, id)
    if (existingWithSlug) {
      return reply.code(409).send({ error: 'Já existe uma categoria com este nome' })
    }
    updateData.name = parsed.data.name
    updateData.slug = newSlug
  }

  if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder

  const updated = await repo.update(id, updateData)

  return reply.code(200).send({ data: updated })
}

// ── DELETE /dashboard/marketplace/categories/:id ──────────────────────────────

export async function deleteCategoryHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  const category = await repo.findById(id)
  if (!category) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }

  if (category.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const hasProd = await repo.hasProducts(id)
  if (hasProd) {
    return reply.code(422).send({ error: 'Categoria possui produtos vinculados' })
  }

  await repo.remove(id)

  return reply.code(204).send()
}

// ── GET /marketplace/categories (público) ─────────────────────────────────────

export async function listPublicCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const categories = await repo.findPublicCategories()

  return reply.code(200).send({ data: categories })
}
