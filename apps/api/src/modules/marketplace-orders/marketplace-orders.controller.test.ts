/**
 * marketplace-orders.controller.test.ts
 *
 * Unit tests for marketplace-orders controller.
 * Requirements: 8.6, 8.7, 8.8, 8.10, 9.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { createOrderHandler, updateOrderStatusHandler } from './marketplace-orders.controller.js'

vi.mock('./marketplace-orders.repository.js', () => ({
  create: vi.fn(),
  findAllByArtist: vi.fn(),
  findById: vi.fn(),
  updateStatus: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    marketplaceProduct: { findMany: vi.fn() },
  },
}))

import * as repo from './marketplace-orders.repository.js'
import { prisma } from '../../lib/prisma.js'

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: string } | null,
  body: unknown = {},
  params: Record<string, string> = {},
): FastifyRequest {
  return { user, body, params } as unknown as FastifyRequest
}

const ARTIST_A = { userId: 'user-001', artistId: 'artist-001', role: 'artist' }
const ARTIST_B = { userId: 'user-002', artistId: 'artist-002', role: 'artist' }

describe('createOrderHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando produto está inativo', async () => {
    vi.mocked(prisma.marketplaceProduct.findMany).mockResolvedValue([])

    const request = makeRequest(null, {
      customerName: 'Maria',
      customerEmail: 'maria@test.com',
      items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 1 }],
    })
    const reply = makeReply()

    await createOrderHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 422 quando produtos de artistas diferentes', async () => {
    vi.mocked(prisma.marketplaceProduct.findMany).mockResolvedValue([
      { id: '00000000-0000-0000-0000-000000000001', artistId: 'artist-001', active: true, type: 'FIXED_PRICE', basePrice: 100, stock: null, title: 'Prod 1' },
      { id: '00000000-0000-0000-0000-000000000002', artistId: 'artist-002', active: true, type: 'FIXED_PRICE', basePrice: 200, stock: null, title: 'Prod 2' },
    ] as any)

    const request = makeRequest(null, {
      customerName: 'Maria',
      customerEmail: 'maria@test.com',
      items: [
        { productId: '00000000-0000-0000-0000-000000000001', quantity: 1 },
        { productId: '00000000-0000-0000-0000-000000000002', quantity: 1 },
      ],
    })
    const reply = makeReply()

    await createOrderHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 422 quando estoque excedido', async () => {
    vi.mocked(prisma.marketplaceProduct.findMany).mockResolvedValue([
      { id: '00000000-0000-0000-0000-000000000001', artistId: 'artist-001', active: true, type: 'FIXED_PRICE', basePrice: 100, stock: 5, title: 'Toldo' },
    ] as any)

    const request = makeRequest(null, {
      customerName: 'Maria',
      customerEmail: 'maria@test.com',
      items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 10 }],
    })
    const reply = makeReply()

    await createOrderHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 201 ao criar pedido com sucesso', async () => {
    vi.mocked(prisma.marketplaceProduct.findMany).mockResolvedValue([
      { id: '00000000-0000-0000-0000-000000000001', artistId: 'artist-001', active: true, type: 'FIXED_PRICE', basePrice: 150, stock: null, title: 'Toldo' },
    ] as any)
    vi.mocked(repo.create).mockResolvedValue({
      id: 'order-1',
      status: 'PENDING',
      total: 300,
    } as any)

    const request = makeRequest(null, {
      customerName: 'Maria',
      customerEmail: 'maria@test.com',
      items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 2 }],
    })
    const reply = makeReply()

    await createOrderHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      artistId: 'artist-001',
      total: 300,
    }))
  })
})

describe('updateOrderStatusHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando transição inválida', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'order-1',
      artistId: 'artist-001',
      status: 'DELIVERED',
    } as any)

    const request = makeRequest(ARTIST_A, { status: 'CONFIRMED' }, { id: 'order-1' })
    const reply = makeReply()

    await updateOrderStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.updateStatus).not.toHaveBeenCalled()
  })

  it('retorna 403 quando pedido pertence a outro artista', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'order-1',
      artistId: 'artist-001',
      status: 'PENDING',
    } as any)

    const request = makeRequest(ARTIST_B, { status: 'CONFIRMED' }, { id: 'order-1' })
    const reply = makeReply()

    await updateOrderStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(repo.updateStatus).not.toHaveBeenCalled()
  })

  it('retorna 200 ao atualizar status com sucesso', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'order-1',
      artistId: 'artist-001',
      status: 'PENDING',
    } as any)
    vi.mocked(repo.updateStatus).mockResolvedValue({
      id: 'order-1',
      status: 'CONFIRMED',
      updatedAt: new Date(),
    } as any)

    const request = makeRequest(ARTIST_A, { status: 'CONFIRMED' }, { id: 'order-1' })
    const reply = makeReply()

    await updateOrderStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(repo.updateStatus).toHaveBeenCalledWith('order-1', 'CONFIRMED')
  })
})
