/**
 * marketplace-quotes.controller.test.ts
 *
 * Unit tests for marketplace-quotes controller.
 * Requirements: 5.4, 5.6, 5.7, 6.7, 6.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createQuoteHandler,
  updateQuoteStatusHandler,
} from './marketplace-quotes.controller.js'

vi.mock('./marketplace-quotes.repository.js', () => ({
  create: vi.fn(),
  findAllByArtist: vi.fn(),
  findById: vi.fn(),
  updateStatus: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    marketplaceProduct: { findFirst: vi.fn() },
  },
}))

import * as repo from './marketplace-quotes.repository.js'
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
  query: Record<string, string> = {},
): FastifyRequest {
  return { user, body, params, query } as unknown as FastifyRequest
}

const ARTIST_A = { userId: 'user-001', artistId: 'artist-001', role: 'artist' }
const ARTIST_B = { userId: 'user-002', artistId: 'artist-002', role: 'artist' }

describe('createQuoteHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando produto está inativo', async () => {
    vi.mocked(prisma.marketplaceProduct.findFirst).mockResolvedValue(null)

    const request = makeRequest(null, {
      productId: '00000000-0000-0000-0000-000000000001',
      requesterName: 'João',
      requesterEmail: 'joao@test.com',
      message: 'Preciso de um orçamento',
      quantity: 1,
    })
    const reply = makeReply()

    await createQuoteHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 400 quando campos obrigatórios ausentes', async () => {
    const request = makeRequest(null, {
      productId: '00000000-0000-0000-0000-000000000001',
      // missing requesterName, requesterEmail, message
    })
    const reply = makeReply()

    await createQuoteHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(400)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 201 ao criar orçamento com sucesso', async () => {
    vi.mocked(prisma.marketplaceProduct.findFirst).mockResolvedValue({
      id: 'prod-1',
      artistId: 'artist-001',
    } as any)
    vi.mocked(repo.create).mockResolvedValue({
      id: 'quote-1',
      status: 'PENDING',
      createdAt: new Date(),
    } as any)

    const request = makeRequest(null, {
      productId: '00000000-0000-0000-0000-000000000001',
      requesterName: 'João',
      requesterEmail: 'joao@test.com',
      message: 'Preciso de um orçamento para toldo 3x4m',
      quantity: 2,
    })
    const reply = makeReply()

    await createQuoteHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(repo.create).toHaveBeenCalled()
  })
})

describe('updateQuoteStatusHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando transição inválida', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'quote-1',
      artistId: 'artist-001',
      status: 'ACCEPTED',
    } as any)

    const request = makeRequest(ARTIST_A, { status: 'ANSWERED' }, { id: 'quote-1' })
    const reply = makeReply()

    await updateQuoteStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.updateStatus).not.toHaveBeenCalled()
  })

  it('retorna 403 quando orçamento pertence a outro artista', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'quote-1',
      artistId: 'artist-001',
      status: 'PENDING',
    } as any)

    const request = makeRequest(ARTIST_B, { status: 'ANSWERED', responseMessage: 'R$ 500' }, { id: 'quote-1' })
    const reply = makeReply()

    await updateQuoteStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(repo.updateStatus).not.toHaveBeenCalled()
  })

  it('retorna 422 quando ANSWERED sem responseMessage', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'quote-1',
      artistId: 'artist-001',
      status: 'PENDING',
    } as any)

    const request = makeRequest(ARTIST_A, { status: 'ANSWERED' }, { id: 'quote-1' })
    const reply = makeReply()

    await updateQuoteStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.updateStatus).not.toHaveBeenCalled()
  })

  it('retorna 200 ao atualizar status com sucesso', async () => {
    vi.mocked(repo.findById).mockResolvedValue({
      id: 'quote-1',
      artistId: 'artist-001',
      status: 'PENDING',
    } as any)
    vi.mocked(repo.updateStatus).mockResolvedValue({
      id: 'quote-1',
      status: 'ANSWERED',
      updatedAt: new Date(),
    } as any)

    const request = makeRequest(ARTIST_A, { status: 'ANSWERED', responseMessage: 'R$ 500 para 3x4m' }, { id: 'quote-1' })
    const reply = makeReply()

    await updateQuoteStatusHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(repo.updateStatus).toHaveBeenCalledWith('quote-1', 'ANSWERED', 'R$ 500 para 3x4m')
  })
})
