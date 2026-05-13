import { prisma } from '../../lib/prisma.js'
import type { CreateCategoryBody, UpdateCategoryBody } from './marketplace-categories.schemas.js'

/**
 * Retorna todas as categorias de um artista, ordenadas por sortOrder.
 */
export async function findAllByArtist(artistId: string) {
  return prisma.marketplaceCategory.findMany({
    where: { artistId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sortOrder: true,
      createdAt: true,
    },
  })
}

/**
 * Busca uma categoria pelo ID.
 */
export async function findById(id: string) {
  return prisma.marketplaceCategory.findUnique({
    where: { id },
    select: { id: true, artistId: true, name: true, slug: true, icon: true, sortOrder: true },
  })
}

/**
 * Cria uma nova categoria para o artista.
 */
export async function create(artistId: string, data: { name: string; slug: string; icon?: string; sortOrder: number }) {
  return prisma.marketplaceCategory.create({
    data: {
      artistId,
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      sortOrder: data.sortOrder,
    },
  })
}

/**
 * Atualiza uma categoria.
 */
export async function update(id: string, data: { name?: string; slug?: string; icon?: string; sortOrder?: number }) {
  return prisma.marketplaceCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })
}

/**
 * Remove uma categoria.
 */
export async function remove(id: string) {
  return prisma.marketplaceCategory.delete({
    where: { id },
  })
}

/**
 * Verifica se a categoria possui produtos vinculados.
 */
export async function hasProducts(categoryId: string): Promise<boolean> {
  const count = await prisma.marketplaceProduct.count({
    where: { categoryId },
  })
  return count > 0
}

/**
 * Busca uma categoria pelo artistId e slug (para verificação de conflito).
 */
export async function findByArtistAndSlug(artistId: string, slug: string, excludeId?: string) {
  return prisma.marketplaceCategory.findFirst({
    where: {
      artistId,
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  })
}

/**
 * Retorna categorias públicas (com ao menos 1 produto ativo), ordenadas por sortOrder.
 */
export async function findPublicCategories() {
  return prisma.marketplaceCategory.findMany({
    where: {
      products: {
        some: { active: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sortOrder: true,
    },
  })
}
