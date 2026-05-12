/**
 * tracks.controller.test.ts
 *
 * Unit tests for tracks.controller.ts
 * Requirements: 3.4, 3.5, 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  getTracksHandler,
  createTrackHandler,
  updateTrackHandler,
  deleteTrackHandler,
} from './tracks.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./tracks.repository.js', () => ({
  findAllByArtist: vi.fn(),
  findById:        vi.fn(),
  create:          vi.fn(),
  update:          vi.fn(),
  remove:          vi.fn(),
}))

import { findAllByArtist, findById, create, update, remove } from './tracks.repository.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: 'admin' | 'artist' | 'editor' },
  body: unknown = {},
  params: Record<string, string> = {},
): FastifyRequest {
  return { user, body, params } as unknown as FastifyRequest
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ARTIST_USER  = { userId: 'user-001', artistId: 'artist-001', role: 'artist' as const }
const EDITOR_USER  = { userId: 'user-002', artistId: 'artist-001', role: 'editor' as const }
const ADMIN_USER   = { userId: 'user-003', artistId: 'artist-003', role: 'admin'  as const }
const OTHER_ARTIST = { userId: 'user-004', artistId: 'artist-004', role: 'artist' as const }

const MOCK_TRACK = {
  id:         'track-001',
  title:      'Noturno em Dó',
  genre:      'piano' as const,
  genreLabel: 'Piano',
  duration:   '3:45',
  key:        'C',
  isPublic:   true,
  sortOrder:  0,
  createdAt:  new Date('2024-01-01T00:00:00Z'),
} as any

const MOCK_TRACK_OWNERSHIP = {
  id:       'track-001',
  artistId: 'artist-001',
}

const VALID_CREATE_BODY = {
  title:       'Noturno em Dó',
  genre:       'piano',
  genre_label: 'Piano',
  duration:    '3:45',
  key:         'C',
  is_public:   true,
  sort_order:  0,
}

// ─── GET /dashboard/tracks ────────────────────────────────────────────────────

describe('getTracksHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com { data } contendo as tracks do artista autenticado', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_TRACK])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getTracksHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith(ARTIST_USER.artistId)
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [MOCK_TRACK] })
  })

  it('retorna 200 com lista vazia quando o artista não tem tracks', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getTracksHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [] })
  })

  it('usa o artistId do AuthContext — nunca de outro lugar', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_TRACK])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getTracksHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith('artist-001')
    expect(findAllByArtist).toHaveBeenCalledTimes(1)
  })
})

// ─── POST /dashboard/tracks ───────────────────────────────────────────────────

describe('createTrackHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('cria track com artistId do JWT — nunca do body', async () => {
    vi.mocked(create).mockResolvedValue({ ...MOCK_TRACK, artistId: 'artist-001' } as unknown as typeof MOCK_TRACK)

    // Body contém um artistId diferente — deve ser ignorado
    const body    = { ...VALID_CREATE_BODY, artistId: 'outro-artist-uuid' }
    const request = makeRequest(ARTIST_USER, body)
    const reply   = makeReply()

    await createTrackHandler(request, reply)

    // O create deve ter sido chamado com o artistId do AuthContext
    expect(create).toHaveBeenCalledWith('artist-001', expect.any(Object))
    expect(create).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })

  it('retorna 201 com { data } após criação bem-sucedida', async () => {
    vi.mocked(create).mockResolvedValue(MOCK_TRACK as unknown as typeof MOCK_TRACK)

    const request = makeRequest(ARTIST_USER, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createTrackHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_TRACK })
  })

  it('retorna 422 quando title está ausente', async () => {
    const { title: _title, ...bodyWithoutTitle } = VALID_CREATE_BODY
    const request = makeRequest(ARTIST_USER, bodyWithoutTitle)
    const reply   = makeReply()

    await createTrackHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando genre é inválido', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, genre: 'genero-invalido' })
    const reply   = makeReply()

    await createTrackHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando title tem menos de 2 caracteres', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, title: 'A' })
    const reply   = makeReply()

    await createTrackHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })
})

// ─── PATCH /dashboard/tracks/:id ─────────────────────────────────────────────

describe('updateTrackHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 quando artista atualiza sua própria track', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(update).mockResolvedValue({ ...MOCK_TRACK, title: 'Novo Título' } as unknown as typeof MOCK_TRACK)

    const request = makeRequest(ARTIST_USER, { title: 'Novo Título' }, { id: 'track-001' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(findById).toHaveBeenCalledWith('track-001')
    expect(update).toHaveBeenCalledWith('track-001', 'artist-001', expect.objectContaining({ title: 'Novo Título' }))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 403 quando artista tenta atualizar track de outro artista', async () => {
    // Track pertence a 'artist-001', mas OTHER_ARTIST tem artistId 'artist-004'
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, { title: 'Tentativa' }, { id: 'track-001' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando a track não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER, { title: 'Novo Título' }, { id: 'track-inexistente' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Não encontrado' })
  })

  it('admin pode atualizar track de qualquer artista', async () => {
    // Track pertence a 'artist-001', admin tem artistId 'artist-003'
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(update).mockResolvedValue({ ...MOCK_TRACK, title: 'Atualizado pelo Admin' } as unknown as typeof MOCK_TRACK)

    const request = makeRequest(ADMIN_USER, { title: 'Atualizado pelo Admin' }, { id: 'track-001' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Admin usa o artistId do recurso, não o seu próprio
    expect(update).toHaveBeenCalledWith('track-001', 'artist-001', expect.any(Object))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('editor pode atualizar track do próprio artista', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(update).mockResolvedValue(MOCK_TRACK as unknown as typeof MOCK_TRACK)

    const request = makeRequest(EDITOR_USER, { title: 'Atualizado pelo Editor' }, { id: 'track-001' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).toHaveBeenCalledWith('track-001', 'artist-001', expect.any(Object))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 422 quando o payload viola o schema Zod', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)

    const request = makeRequest(ARTIST_USER, { genre: 'genero-invalido' }, { id: 'track-001' })
    const reply   = makeReply()

    await updateTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })
})

// ─── DELETE /dashboard/tracks/:id ────────────────────────────────────────────

describe('deleteTrackHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 204 quando artista deleta sua própria track', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_TRACK)

    const request = makeRequest(ARTIST_USER, {}, { id: 'track-001' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(findById).toHaveBeenCalledWith('track-001')
    expect(remove).toHaveBeenCalledWith('track-001', 'artist-001')
    expect(reply.code).toHaveBeenCalledWith(204)
  })

  it('retorna 403 quando role é editor — editor não pode deletar', async () => {
    const request = makeRequest(EDITOR_USER, {}, { id: 'track-001' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Deve rejeitar antes mesmo de buscar a track
    expect(findById).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Permissão insuficiente' })
  })

  it('retorna 403 quando artista tenta deletar track de outro artista', async () => {
    // Track pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-004'
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, {}, { id: 'track-001' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando a track não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER, {}, { id: 'track-inexistente' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Não encontrado' })
  })

  it('admin pode deletar track de qualquer artista', async () => {
    // Track pertence a 'artist-001', admin tem artistId 'artist-003'
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_TRACK)

    const request = makeRequest(ADMIN_USER, {}, { id: 'track-001' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Admin usa o artistId do recurso, não o seu próprio
    expect(remove).toHaveBeenCalledWith('track-001', 'artist-001')
    expect(reply.code).toHaveBeenCalledWith(204)
  })

  it('usa o artistId do AuthContext para o remove — nunca do body', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_TRACK_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_TRACK)

    // Body contém um artistId diferente — deve ser ignorado
    const request = makeRequest(ARTIST_USER, { artistId: 'outro-artist-uuid' }, { id: 'track-001' })
    const reply   = makeReply()

    await deleteTrackHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).toHaveBeenCalledWith('track-001', 'artist-001')
    expect(remove).not.toHaveBeenCalledWith('track-001', 'outro-artist-uuid')
  })
})
