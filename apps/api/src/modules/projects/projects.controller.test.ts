/**
 * projects.controller.test.ts
 *
 * Unit tests for projects.controller.ts
 * Requirements: 3.4, 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  getProjectsHandler,
  createProjectHandler,
} from './projects.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./projects.repository.js', () => ({
  findAllByArtist: vi.fn(),
  create:          vi.fn(),
}))

import { findAllByArtist, create } from './projects.repository.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: 'admin' | 'artist' | 'editor' },
  body: unknown = {},
): FastifyRequest {
  return { user, body } as unknown as FastifyRequest
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ARTIST_USER = { userId: 'user-001', artistId: 'artist-001', role: 'artist' as const }
const ADMIN_USER  = { userId: 'user-002', artistId: 'artist-002', role: 'admin'  as const }

const MOCK_PROJECT = {
  id:        'project-001',
  title:     'Álbum Noturno',
  platform:  'spotify' as const,
  tags:      ['jazz', 'piano'],
  href:      'https://open.spotify.com/album/abc123',
  featured:  false,
  status:    'active' as const,
  sortOrder: 0,
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

const VALID_CREATE_BODY = {
  title:    'Álbum Noturno',
  platform: 'spotify',
  tags:     ['jazz', 'piano'],
  href:     'https://open.spotify.com/album/abc123',
}

// ─── GET /dashboard/projects ──────────────────────────────────────────────────

describe('getProjectsHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com { data } contendo os projetos do artista autenticado', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_PROJECT])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProjectsHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith(ARTIST_USER.artistId)
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [MOCK_PROJECT] })
  })

  it('retorna 200 com lista vazia quando o artista não tem projetos', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProjectsHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [] })
  })

  it('usa o artistId do AuthContext — nunca de outro lugar', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_PROJECT])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProjectsHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith('artist-001')
    expect(findAllByArtist).toHaveBeenCalledTimes(1)
  })

  it('admin recebe projetos do seu próprio artistId', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([])

    const request = makeRequest(ADMIN_USER)
    const reply   = makeReply()

    await getProjectsHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith('artist-002')
  })
})

// ─── POST /dashboard/projects ─────────────────────────────────────────────────

describe('createProjectHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('cria projeto com artistId do JWT — nunca do body', async () => {
    vi.mocked(create).mockResolvedValue({ ...MOCK_PROJECT, artistId: 'artist-001' } as unknown as typeof MOCK_PROJECT)

    // Body contém um artistId diferente — deve ser ignorado
    const body    = { ...VALID_CREATE_BODY, artistId: 'outro-artist-uuid' }
    const request = makeRequest(ARTIST_USER, body)
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).toHaveBeenCalledWith('artist-001', expect.any(Object))
    expect(create).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })

  it('retorna 201 com { data } após criação bem-sucedida', async () => {
    vi.mocked(create).mockResolvedValue(MOCK_PROJECT as unknown as typeof MOCK_PROJECT)

    const request = makeRequest(ARTIST_USER, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_PROJECT })
  })

  it('retorna 422 quando href é uma URL inválida', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, href: 'nao-e-uma-url' })
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando title está ausente', async () => {
    const { title: _title, ...bodyWithoutTitle } = VALID_CREATE_BODY
    const request = makeRequest(ARTIST_USER, bodyWithoutTitle)
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando platform é inválida', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, platform: 'tiktok' })
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando title tem menos de 2 caracteres', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, title: 'A' })
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando thumbnail_url é uma URL inválida', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, thumbnail_url: 'nao-e-url' })
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('aceita payload mínimo válido (apenas campos obrigatórios)', async () => {
    vi.mocked(create).mockResolvedValue(MOCK_PROJECT as unknown as typeof MOCK_PROJECT)

    const minimalBody = {
      title:    'Projeto Mínimo',
      platform: 'outro',
      href:     'https://example.com/projeto',
    }
    const request = makeRequest(ARTIST_USER, minimalBody)
    const reply   = makeReply()

    await createProjectHandler(request, reply)

    expect(create).toHaveBeenCalledWith('artist-001', expect.objectContaining({ title: 'Projeto Mínimo' }))
    expect(reply.code).toHaveBeenCalledWith(201)
  })
})
