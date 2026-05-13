/**
 * marketplace-products.controller.test.ts
 *
 * Unit tests for marketplace-products controller.
 * Requirements: 2.5, 2.6, 2.7, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createProductHandler,
  getProductHandler,
  listPublicProductsHandler,
} from './marketplace-products.controller.js'

// Mock repository
vi.mock('./marketplace-products.repository.js', () => ({
  findById: vi.fn(),
  findAllByArtist: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findPublicProducts: vi.fn(),
  findPublicBySlug: vi.fn(),
  findProductImages: vi.fn(),
  countProductImages: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    marketplaceCategory: { findFirst: vi.fn() },
    marketplaceProduct: { findFirst: vi.fn() },
  },
}))

vi.mock('./marketplace-products.service.js', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    generateProductSlug: vi.fn().mockResolvedValue('test-slug'),
  }
})

import * as repo from './marketplace-products.repository.js'
import { prisma } from '../../lib/prisma.js'

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: string },
  body: unknown = {},
  params: Record<string, string> = {},
  query: Record<string, string> = {},
): FastifyRequest {
  return { user, body, params, query } as unknown as FastifyRequest
}

const ARTIST_A = { userId: 'user-001', artistId: 'artist-001', role: 'artist' }

// ── POST /dashboard/marketplace/products ──────────────────────────────────────

describe('createProductHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando FIXED_PRICE sem basePrice', async () => {
    const request = makeRequest(ARTIST_A, {
      title: 'Toldo Retrátil',
      type: 'FIXED_PRICE',
      categoryId: '00000000-0000-0000-0000-000000000001',
      // basePrice missing
    })
    const reply = makeReply()

    vi.mocked(prisma.marketplaceCategory.findFirst).mockResolvedValue({ id: 'cat-1' } as any)

    await createProductHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 422 quando categoryId de outro artista', async () => {
    const request = makeRequest(ARTIST_A, {
      title: 'Toldo Retrátil',
      type: 'QUOTE_ONLY',
      categoryId: '00000000-0000-0000-0000-000000000001',
    })
    const reply = makeReply()

    // Category not found for this artist
    vi.mocked(prisma.marketplaceCategory.findFirst).mockResolvedValue(null)

    await createProductHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 201 ao criar produto QUOTE_ONLY com sucesso', async () => {
    const request = makeRequest(ARTIST_A, {
      title: 'Toldo Retrátil',
      type: 'QUOTE_ONLY',
      categoryId: '00000000-0000-0000-0000-000000000001',
    })
    const reply = makeReply()

    vi.mocked(prisma.marketplaceCategory.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
    vi.mocked(repo.create).mockResolvedValue({ id: 'prod-1', title: 'Toldo Retrátil', slug: 'test-slug' } as any)

    await createProductHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(repo.create).toHaveBeenCalled()
  })
})

// ── GET /dashboard/marketplace/products/:id ───────────────────────────────────

describe('getProductHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 404 quando produto não existe', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_A, {}, { id: 'prod-inexistente' })
    const reply = makeReply()

    await getProductHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(404)
  })

  it('retorna 403 quando produto pertence a outro artista', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'prod-1',
      artistId: 'artist-other',
      title: 'Test',
      slug: 'test',
      type: 'FIXED_PRICE',
      basePrice: 100,
      description: null,
      shortDescription: null,
      active: true,
      featured: false,
      customizable: false,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: null,
      color: null,
      categoryId: 'cat-1',
      sortOrder: 0,
      createdAt: new Date(),
      images: [],
    } as any)

    const request = makeRequest(ARTIST_A, {}, { id: 'prod-1' })
    const reply = makeReply()

    await getProductHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
  })
})

// ── GET /marketplace/products (público) ───────────────────────────────────────

describe('listPublicProductsHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 400 quando page < 1', async () => {
    const request = makeRequest(ARTIST_A, {}, {}, { page: '0', pageSize: '12' })
    const reply = makeReply()

    await listPublicProductsHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('retorna 400 quando pageSize > 50', async () => {
    const request = makeRequest(ARTIST_A, {}, {}, { page: '1', pageSize: '100' })
    const reply = makeReply()

    await listPublicProductsHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(400)
  })
})
