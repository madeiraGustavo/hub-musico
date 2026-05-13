import { prisma } from '../../lib/prisma.js'

/**
 * Cria um pedido com itens.
 */
export async function create(data: {
  artistId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  total: number
  items: Array<{ productId: string; quantity: number; unitPrice: number }>
}) {
  return prisma.marketplaceOrder.create({
    data: {
      artistId: data.artistId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      total: data.total,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    select: { id: true, status: true, total: true },
  })
}

/**
 * Lista pedidos do artista com paginação e filtro por status.
 */
export async function findAllByArtist(artistId: string, page: number, pageSize: number, status?: string) {
  const where: Record<string, unknown> = { artistId }
  if (status) where.status = status

  const [data, total] = await Promise.all([
    prisma.marketplaceOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        total: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: { id: true, title: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.marketplaceOrder.count({ where }),
  ])

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/**
 * Busca pedido pelo ID.
 */
export async function findById(id: string) {
  return prisma.marketplaceOrder.findUnique({
    where: { id },
    select: { id: true, artistId: true, status: true },
  })
}

/**
 * Atualiza status de um pedido.
 */
export async function updateStatus(id: string, status: string) {
  return prisma.marketplaceOrder.update({
    where: { id },
    data: { status: status as any },
    select: { id: true, status: true, updatedAt: true },
  })
}
