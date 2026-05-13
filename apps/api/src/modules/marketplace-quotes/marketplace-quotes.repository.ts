import { prisma } from '../../lib/prisma.js'

/**
 * Cria uma solicitação de orçamento.
 */
export async function create(data: {
  artistId: string
  productId: string
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  message: string
  widthCm?: number
  heightCm?: number
  quantity: number
}) {
  return prisma.marketplaceQuoteRequest.create({
    data,
    select: { id: true, status: true, createdAt: true },
  })
}

/**
 * Lista orçamentos do artista com paginação e filtro por status.
 */
export async function findAllByArtist(artistId: string, page: number, pageSize: number, status?: string) {
  const where: Record<string, unknown> = { artistId }
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.marketplaceQuoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        requesterName: true,
        requesterEmail: true,
        requesterPhone: true,
        message: true,
        widthCm: true,
        heightCm: true,
        quantity: true,
        status: true,
        responseMessage: true,
        createdAt: true,
        product: {
          select: { id: true, title: true, slug: true },
        },
      },
    }),
    prisma.marketplaceQuoteRequest.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Busca orçamento pelo ID.
 */
export async function findById(id: string) {
  return prisma.marketplaceQuoteRequest.findUnique({
    where: { id },
    select: { id: true, artistId: true, status: true },
  })
}

/**
 * Atualiza status de um orçamento.
 */
export async function updateStatus(id: string, status: string, responseMessage?: string) {
  return prisma.marketplaceQuoteRequest.update({
    where: { id },
    data: {
      status: status as any,
      ...(responseMessage !== undefined && { responseMessage }),
    },
    select: { id: true, status: true, updatedAt: true },
  })
}
