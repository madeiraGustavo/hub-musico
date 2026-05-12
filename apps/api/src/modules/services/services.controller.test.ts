/**
 * services.controller.test.ts
 *
 * Unit tests for services.controller.ts
 * Requirements: 3.4, 3.5, 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  getServicesHandler,
  createServiceHandler,
  updateServiceHandler,
  deleteServiceHandler,
} from './services.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./services.repository.js', () => ({
  findAllByArtist: vi.fn(),
  findById:        vi.fn(),
  create:          vi.fn(),
  update:          vi.fn(),
  remove:          vi.fn(),
}))

import { findAllByArtist, findById, create, update, remove } from './services.repository.js'

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

const MOCK_SERVICE = {
  id:          'service-001',
  icon:        'mic' as const,
  title:       'Gravação de Voz',
  description: 'Gravação profissional em estúdio com tratamento acústico.',
  items:       ['Mixagem incluída', 'Até 3 revisões'],
  price:       'R$ 300/hora',
  highlight:   false,
  sortOrder:   0,
  active:      true,
  createdAt:   new Date('2024-01-01T00:00:00Z'),
} as any

const MOCK_SERVICE_OWNERSHIP = {
  id:       'service-001',
  artistId: 'artist-001',
}

const VALID_CREATE_BODY = {
  icon:        'mic',
  title:       'Gravação de Voz',
  description: 'Gravação profissional em estúdio com tratamento acústico.',
  items:       ['Mixagem incluída', 'Até 3 revisões'],
  price:       'R$ 300/hora',
  highlight:   false,
  sort_order:  0,
}

// ─── GET /dashboard/services ──────────────────────────────────────────────────

describe('getServicesHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com { data } contendo os serviços do artista autenticado', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_SERVICE])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getServicesHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith(ARTIST_USER.artistId)
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [MOCK_SERVICE] })
  })

  it('retorna 200 com lista vazia quando o artista não tem serviços', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getServicesHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [] })
  })

  it('usa o artistId do AuthContext — nunca de outro lugar', async () => {
    vi.mocked(findAllByArtist).mockResolvedValue([MOCK_SERVICE])

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getServicesHandler(request, reply)

    expect(findAllByArtist).toHaveBeenCalledWith('artist-001')
    expect(findAllByArtist).toHaveBeenCalledTimes(1)
  })
})

// ─── POST /dashboard/services ─────────────────────────────────────────────────

describe('createServiceHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('cria serviço com artistId do JWT — nunca do body', async () => {
    vi.mocked(create).mockResolvedValue({ ...MOCK_SERVICE, artistId: 'artist-001' } as unknown as typeof MOCK_SERVICE)

    // Body contém um artistId diferente — deve ser ignorado
    const body    = { ...VALID_CREATE_BODY, artistId: 'outro-artist-uuid' }
    const request = makeRequest(ARTIST_USER, body)
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).toHaveBeenCalledWith('artist-001', expect.any(Object))
    expect(create).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })

  it('retorna 201 com { data } após criação bem-sucedida', async () => {
    vi.mocked(create).mockResolvedValue(MOCK_SERVICE as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(ARTIST_USER, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_SERVICE })
  })

  it('retorna 422 quando title está ausente', async () => {
    const { title: _title, ...bodyWithoutTitle } = VALID_CREATE_BODY
    const request = makeRequest(ARTIST_USER, bodyWithoutTitle)
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando icon é inválido', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, icon: 'icone-invalido' })
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando description tem menos de 10 caracteres', async () => {
    const request = makeRequest(ARTIST_USER, { ...VALID_CREATE_BODY, description: 'Curta' })
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando price está ausente', async () => {
    const { price: _price, ...bodyWithoutPrice } = VALID_CREATE_BODY
    const request = makeRequest(ARTIST_USER, bodyWithoutPrice)
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('aceita payload mínimo válido (apenas campos obrigatórios)', async () => {
    vi.mocked(create).mockResolvedValue(MOCK_SERVICE as unknown as typeof MOCK_SERVICE)

    const minimalBody = {
      icon:        'star',
      title:       'Serviço Mínimo',
      description: 'Descrição mínima válida aqui.',
      price:       'Sob consulta',
    }
    const request = makeRequest(ARTIST_USER, minimalBody)
    const reply   = makeReply()

    await createServiceHandler(request, reply)

    expect(create).toHaveBeenCalledWith('artist-001', expect.objectContaining({ title: 'Serviço Mínimo' }))
    expect(reply.code).toHaveBeenCalledWith(201)
  })
})

// ─── PATCH /dashboard/services/:id ───────────────────────────────────────────

describe('updateServiceHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 quando artista atualiza seu próprio serviço', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(update).mockResolvedValue({ ...MOCK_SERVICE, title: 'Novo Título' } as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(ARTIST_USER, { title: 'Novo Título' }, { id: 'service-001' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(findById).toHaveBeenCalledWith('service-001')
    expect(update).toHaveBeenCalledWith('service-001', 'artist-001', expect.objectContaining({ title: 'Novo Título' }))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 403 quando artista tenta atualizar serviço de outro artista', async () => {
    // Serviço pertence a 'artist-001', mas OTHER_ARTIST tem artistId 'artist-004'
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, { title: 'Tentativa' }, { id: 'service-001' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando o serviço não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER, { title: 'Novo Título' }, { id: 'service-inexistente' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Não encontrado' })
  })

  it('admin pode atualizar serviço de qualquer artista', async () => {
    // Serviço pertence a 'artist-001', admin tem artistId 'artist-003'
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(update).mockResolvedValue({ ...MOCK_SERVICE, title: 'Atualizado pelo Admin' } as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(ADMIN_USER, { title: 'Atualizado pelo Admin' }, { id: 'service-001' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Admin usa o artistId do recurso, não o seu próprio
    expect(update).toHaveBeenCalledWith('service-001', 'artist-001', expect.any(Object))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('editor pode atualizar serviço do próprio artista', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(update).mockResolvedValue(MOCK_SERVICE as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(EDITOR_USER, { title: 'Atualizado pelo Editor' }, { id: 'service-001' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).toHaveBeenCalledWith('service-001', 'artist-001', expect.any(Object))
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 422 quando o payload viola o schema Zod', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)

    const request = makeRequest(ARTIST_USER, { icon: 'icone-invalido' }, { id: 'service-001' })
    const reply   = makeReply()

    await updateServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })
})

// ─── DELETE /dashboard/services/:id ──────────────────────────────────────────

describe('deleteServiceHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 204 quando artista deleta seu próprio serviço', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(ARTIST_USER, {}, { id: 'service-001' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(findById).toHaveBeenCalledWith('service-001')
    expect(remove).toHaveBeenCalledWith('service-001', 'artist-001')
    expect(reply.code).toHaveBeenCalledWith(204)
  })

  it('retorna 403 quando role é editor — editor não pode deletar', async () => {
    const request = makeRequest(EDITOR_USER, {}, { id: 'service-001' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Deve rejeitar antes mesmo de buscar o serviço
    expect(findById).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Permissão insuficiente' })
  })

  it('retorna 403 quando artista tenta deletar serviço de outro artista', async () => {
    // Serviço pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-004'
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, {}, { id: 'service-001' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando o serviço não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER, {}, { id: 'service-inexistente' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Não encontrado' })
  })

  it('admin pode deletar serviço de qualquer artista', async () => {
    // Serviço pertence a 'artist-001', admin tem artistId 'artist-003'
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_SERVICE)

    const request = makeRequest(ADMIN_USER, {}, { id: 'service-001' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    // Admin usa o artistId do recurso, não o seu próprio
    expect(remove).toHaveBeenCalledWith('service-001', 'artist-001')
    expect(reply.code).toHaveBeenCalledWith(204)
  })

  it('usa o artistId do AuthContext para o remove — nunca do body', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_SERVICE_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as typeof MOCK_SERVICE)

    // Body contém um artistId diferente — deve ser ignorado
    const request = makeRequest(ARTIST_USER, { artistId: 'outro-artist-uuid' }, { id: 'service-001' })
    const reply   = makeReply()

    await deleteServiceHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(remove).toHaveBeenCalledWith('service-001', 'artist-001')
    expect(remove).not.toHaveBeenCalledWith('service-001', 'outro-artist-uuid')
  })
})
