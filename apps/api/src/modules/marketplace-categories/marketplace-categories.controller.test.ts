/**
 * marketplace-categories.controller.test.ts
 *
 * Unit tests for marketplace-categories controller.
 * Requirements: 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listPublicCategoriesHandler,
} from './marketplace-categories.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./marketplace-categories.repository.js', () => ({
  findAllByArtist:    vi.fn(),
  findById:           vi.fn(),
  findByArtistAndSlug: vi.fn(),
  create:             vi.fn(),
  update:             vi.fn(),
  remove:             vi.fn(),
  hasProducts:        vi.fn(),
  findPublicCategories: vi.fn(),
}))

import * as repo from './marketplace-categories.repository.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: string },
  body: unknown = {},
  params: Record<string, string> = {},
): FastifyRequest {
  return { user, body, params } as unknown as FastifyRequest
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ARTIST_A = { userId: 'user-001', artistId: 'artist-001', role: 'artist' }
const ARTIST_B = { userId: 'user-002', artistId: 'artist-002', role: 'artist' }

const MOCK_CATEGORY = {
  id: 'cat-001',
  artistId: 'artist-001',
  name: 'Toldos',
  slug: 'toldos',
  icon: 'sun',
  sortOrder: 0,
  createdAt: new Date('2024-01-01'),
}

// ── POST /dashboard/marketplace/categories ────────────────────────────────────

describe('createCategoryHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 201 ao criar categoria com sucesso', async () => {
    vi.mocked(repo.findByArtistAndSlug).mockResolvedValue(null)
    vi.mocked(repo.create).mockResolvedValue(MOCK_CATEGORY as any)

    const request = makeRequest(ARTIST_A, { name: 'Toldos', icon: 'sun', sortOrder: 0 })
    const reply = makeReply()

    await createCategoryHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect(repo.create).toHaveBeenCalledWith('artist-001', expect.objectContaining({ name: 'Toldos', slug: 'toldos' }))
  })

  it('retorna 409 quando slug duplicado para o mesmo artista', async () => {
    vi.mocked(repo.findByArtistAndSlug).mockResolvedValue({ id: 'cat-existing' })

    const request = makeRequest(ARTIST_A, { name: 'Toldos' })
    const reply = makeReply()

    await createCategoryHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(409)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('retorna 422 quando nome é muito curto', async () => {
    const request = makeRequest(ARTIST_A, { name: 'A' })
    const reply = makeReply()

    await createCategoryHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.create).not.toHaveBeenCalled()
  })
})

// ── PATCH /dashboard/marketplace/categories/:id ───────────────────────────────

describe('updateCategoryHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 403 quando artista tenta atualizar categoria de outro artista', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)

    const request = makeRequest(ARTIST_B, { name: 'Novo Nome' }, { id: 'cat-001' })
    const reply = makeReply()

    await updateCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('retorna 404 quando categoria não existe', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_A, { name: 'Novo Nome' }, { id: 'cat-inexistente' })
    const reply = makeReply()

    await updateCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(404)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('retorna 409 quando novo nome gera slug duplicado', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)
    vi.mocked(repo.findByArtistAndSlug).mockResolvedValue({ id: 'cat-other' })

    const request = makeRequest(ARTIST_A, { name: 'Capotas' }, { id: 'cat-001' })
    const reply = makeReply()

    await updateCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(409)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('retorna 200 ao atualizar com sucesso', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)
    vi.mocked(repo.findByArtistAndSlug).mockResolvedValue(null)
    vi.mocked(repo.update).mockResolvedValue({ ...MOCK_CATEGORY, name: 'Capotas', slug: 'capotas' } as any)

    const request = makeRequest(ARTIST_A, { name: 'Capotas' }, { id: 'cat-001' })
    const reply = makeReply()

    await updateCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(repo.update).toHaveBeenCalledWith('cat-001', expect.objectContaining({ name: 'Capotas', slug: 'capotas' }))
  })
})

// ── DELETE /dashboard/marketplace/categories/:id ──────────────────────────────

describe('deleteCategoryHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 403 quando artista tenta deletar categoria de outro artista', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)

    const request = makeRequest(ARTIST_B, {}, { id: 'cat-001' })
    const reply = makeReply()

    await deleteCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(repo.remove).not.toHaveBeenCalled()
  })

  it('retorna 404 quando categoria não existe', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_A, {}, { id: 'cat-inexistente' })
    const reply = makeReply()

    await deleteCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(404)
    expect(repo.remove).not.toHaveBeenCalled()
  })

  it('retorna 422 quando categoria possui produtos vinculados', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)
    vi.mocked(repo.hasProducts).mockResolvedValue(true)

    const request = makeRequest(ARTIST_A, {}, { id: 'cat-001' })
    const reply = makeReply()

    await deleteCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(422)
    expect(repo.remove).not.toHaveBeenCalled()
  })

  it('retorna 204 ao deletar com sucesso', async () => {
    vi.mocked(repo.findById).mockResolvedValue(MOCK_CATEGORY as any)
    vi.mocked(repo.hasProducts).mockResolvedValue(false)
    vi.mocked(repo.remove).mockResolvedValue(undefined as any)

    const request = makeRequest(ARTIST_A, {}, { id: 'cat-001' })
    const reply = makeReply()

    await deleteCategoryHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(204)
    expect(repo.remove).toHaveBeenCalledWith('cat-001')
  })
})

// ── GET /marketplace/categories (público) ─────────────────────────────────────

describe('listPublicCategoriesHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com categorias públicas', async () => {
    vi.mocked(repo.findPublicCategories).mockResolvedValue([
      { id: 'cat-001', name: 'Toldos', slug: 'toldos', icon: 'sun', sortOrder: 0 },
    ] as any)

    const request = makeRequest(ARTIST_A)
    const reply = makeReply()

    await listPublicCategoriesHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect(repo.findPublicCategories).toHaveBeenCalled()
  })
})
