/**
 * marketplace-products.ownership.property.test.ts
 *
 * Property 3: Ownership isolation
 *
 * Validates: Requirements 2.4, 2.5, 12.1, 12.3
 *
 * Tests that the controller correctly rejects access when artistId doesn't match.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getProductHandler, deleteProductHandler } from './marketplace-products.controller.js'

// Mock repository
vi.mock('./marketplace-products.repository.js', () => ({
  findById: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findAllByArtist: vi.fn(),
  create: vi.fn(),
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

import * as repo from './marketplace-products.repository.js'

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeMockProduct(id: string, artistId: string) {
  return {
    id,
    artistId,
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
  } as any
}

// ── Property 3: Ownership isolation ──────────────────────────────────────────

describe('Property 3: Ownership isolation', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it(
    'GET product: returns 403 when artistId does not match (property-based)',
    async () => {
      // Generate pairs of distinct artist IDs
      const pairs = fc.sample(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
        100,
      )

      for (const [ownerArtistId, requestingArtistId] of pairs) {
        vi.clearAllMocks()
        const productId = 'prod-001'

        vi.mocked(repo.findById).mockResolvedValue(makeMockProduct(productId, ownerArtistId))

        const request = {
          user: { userId: 'u1', artistId: requestingArtistId, role: 'artist' },
          params: { id: productId },
        } as unknown as FastifyRequest<{ Params: { id: string } }>

        const reply = makeReply()
        await getProductHandler(request, reply)

        expect(reply.code).toHaveBeenCalledWith(403)
      }
    },
  )

  it(
    'DELETE product: returns 403 when artistId does not match (property-based)',
    async () => {
      const pairs = fc.sample(
        fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
        100,
      )

      for (const [ownerArtistId, requestingArtistId] of pairs) {
        vi.clearAllMocks()
        const productId = 'prod-001'

        vi.mocked(repo.findById).mockResolvedValue(makeMockProduct(productId, ownerArtistId))

        const request = {
          user: { userId: 'u1', artistId: requestingArtistId, role: 'artist' },
          params: { id: productId },
        } as unknown as FastifyRequest<{ Params: { id: string } }>

        const reply = makeReply()
        await deleteProductHandler(request, reply)

        expect(reply.code).toHaveBeenCalledWith(403)
      }
    },
  )
})
