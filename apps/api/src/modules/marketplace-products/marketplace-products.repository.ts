import { prisma } from '../../lib/prisma.js'

/**
 * Lista produtos do artista com paginação.
 */
export async function findAllByArtist(artistId: string, page: number, pageSize: number) {
  const [data, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where: { artistId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        basePrice: true,
        active: true,
        featured: true,
        stock: true,
        sortOrder: true,
        categoryId: true,
        createdAt: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.marketplaceProduct.count({ where: { artistId } }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Busca produto pelo ID (para ownership check).
 */
export async function findById(id: string) {
  return prisma.marketplaceProduct.findUnique({
    where: { id },
    select: {
      id: true,
      artistId: true,
      title: true,
      slug: true,
      type: true,
      basePrice: true,
      description: true,
      shortDescription: true,
      active: true,
      featured: true,
      customizable: true,
      stock: true,
      widthCm: true,
      heightCm: true,
      material: true,
      color: true,
      categoryId: true,
      sortOrder: true,
      createdAt: true,
      images: {
        select: { id: true, url: true, alt: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

/**
 * Cria um produto.
 */
export async function create(artistId: string, data: {
  title: string
  slug: string
  description?: string
  shortDescription?: string
  type: 'FIXED_PRICE' | 'QUOTE_ONLY'
  basePrice?: number
  active: boolean
  featured: boolean
  customizable: boolean
  stock?: number
  widthCm?: number
  heightCm?: number
  material?: string
  color?: string
  categoryId: string
  sortOrder: number
}) {
  return prisma.marketplaceProduct.create({
    data: {
      artistId,
      title: data.title,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      type: data.type,
      basePrice: data.basePrice,
      active: data.active,
      featured: data.featured,
      customizable: data.customizable,
      stock: data.stock,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      material: data.material,
      color: data.color,
      categoryId: data.categoryId,
      sortOrder: data.sortOrder,
    },
  })
}

/**
 * Atualiza um produto.
 */
export async function update(id: string, data: Record<string, unknown>) {
  return prisma.marketplaceProduct.update({
    where: { id },
    data,
  })
}

/**
 * Remove um produto.
 */
export async function remove(id: string) {
  return prisma.marketplaceProduct.delete({
    where: { id },
  })
}

/**
 * Lista produtos públicos (active=true) com filtros e paginação.
 */
export async function findPublicProducts(params: {
  page: number
  pageSize: number
  categoryId?: string
  featured?: boolean
}) {
  const where: Record<string, unknown> = { active: true }
  if (params.categoryId) where.categoryId = params.categoryId
  if (params.featured !== undefined) where.featured = params.featured

  const [data, total] = await Promise.all([
    prisma.marketplaceProduct.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        basePrice: true,
        categoryId: true,
        featured: true,
        sortOrder: true,
        createdAt: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.marketplaceProduct.count({ where }),
  ])

  return { data, total, page: params.page, pageSize: params.pageSize, totalPages: Math.ceil(total / params.pageSize) }
}

/**
 * Busca produto público por slug.
 */
export async function findPublicBySlug(slug: string) {
  return prisma.marketplaceProduct.findFirst({
    where: { slug, active: true },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      shortDescription: true,
      type: true,
      basePrice: true,
      customizable: true,
      widthCm: true,
      heightCm: true,
      material: true,
      color: true,
      categoryId: true,
      images: {
        select: { id: true, url: true, alt: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

/**
 * Busca imagens de um produto.
 */
export async function findProductImages(productId: string) {
  return prisma.marketplaceProductImage.findMany({
    where: { productId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true, alt: true, sortOrder: true },
  })
}

/**
 * Conta imagens de um produto.
 */
export async function countProductImages(productId: string): Promise<number> {
  return prisma.marketplaceProductImage.count({
    where: { productId },
  })
}
