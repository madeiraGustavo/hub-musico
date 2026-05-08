/**
 * profile.controller.test.ts
 *
 * Unit tests for profile.controller.ts
 * Requirements: 3.4, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getProfileHandler, updateProfileHandler } from './profile.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./profile.repository.js', () => ({
  findByArtistId: vi.fn(),
  update:         vi.fn(),
}))

import { findByArtistId, update } from './profile.repository.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const MOCK_PROFILE = {
  id:        'artist-uuid-001',
  name:      'João Silva',
  slug:      'joao-silva',
  tagline:   'Músico e produtor',
  bio:       ['Toco piano desde os 7 anos.'],
  location:  'São Paulo, SP',
  reach:     'Nacional',
  email:     'joao@example.com',
  whatsapp:  '+5511999999999',
  skills:    ['Piano', 'Composição'],
  tools:     ['Ableton', 'Logic Pro'],
  isActive:  true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

const ARTIST_USER = { userId: 'user-001', artistId: 'artist-uuid-001', role: 'artist' as const }
const EDITOR_USER = { userId: 'user-002', artistId: 'artist-uuid-001', role: 'editor' as const }
const ADMIN_USER  = { userId: 'user-003', artistId: 'artist-uuid-001', role: 'admin'  as const }

// ─── GET /dashboard/profile ───────────────────────────────────────────────────

describe('getProfileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 200 com { data } quando o perfil existe', async () => {
    vi.mocked(findByArtistId).mockResolvedValue(MOCK_PROFILE)

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProfileHandler(request, reply)

    expect(findByArtistId).toHaveBeenCalledWith(ARTIST_USER.artistId)
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_PROFILE })
  })

  it('retorna 404 quando o artista não existe no banco', async () => {
    vi.mocked(findByArtistId).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProfileHandler(request, reply)

    expect(findByArtistId).toHaveBeenCalledWith(ARTIST_USER.artistId)
    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Perfil não encontrado' })
  })

  it('usa o artistId do AuthContext — nunca de outro lugar', async () => {
    vi.mocked(findByArtistId).mockResolvedValue(MOCK_PROFILE)

    const request = makeRequest(ARTIST_USER)
    const reply   = makeReply()

    await getProfileHandler(request, reply)

    // Deve consultar exatamente o artistId do AuthContext
    expect(findByArtistId).toHaveBeenCalledWith('artist-uuid-001')
    expect(findByArtistId).toHaveBeenCalledTimes(1)
  })
})

// ─── PATCH /dashboard/profile ─────────────────────────────────────────────────

describe('updateProfileHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const UPDATED_PROFILE = {
    id:        'artist-uuid-001',
    name:      'João Silva Atualizado',
    tagline:   'Nova tagline',
    updatedAt: new Date('2024-06-01T00:00:00Z'),
  }

  // ── Campos não-sensíveis ──────────────────────────────────────────────────

  it('retorna 200 quando artist atualiza campos não-sensíveis', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    const request = makeRequest(ARTIST_USER, { name: 'João Silva Atualizado', tagline: 'Nova tagline' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).toHaveBeenCalledWith(
      ARTIST_USER.artistId,
      expect.objectContaining({ name: 'João Silva Atualizado', tagline: 'Nova tagline' }),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: UPDATED_PROFILE })
  })

  it('retorna 200 quando editor atualiza campos não-sensíveis (name, tagline, bio, skills, tools)', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    const request = makeRequest(EDITOR_USER, { name: 'Nome Novo', skills: ['Piano'] })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).toHaveBeenCalledWith(
      EDITOR_USER.artistId,
      expect.objectContaining({ name: 'Nome Novo', skills: ['Piano'] }),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  // ── Campos sensíveis — role editor ───────────────────────────────────────

  it('retorna 403 quando editor tenta alterar email', async () => {
    const request = makeRequest(EDITOR_USER, { email: 'novo@example.com' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Permissão insuficiente' })
  })

  it('retorna 403 quando editor tenta alterar whatsapp', async () => {
    const request = makeRequest(EDITOR_USER, { whatsapp: '+5511888888888' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Permissão insuficiente' })
  })

  it('retorna 403 quando editor tenta alterar email junto com campos permitidos', async () => {
    const request = makeRequest(EDITOR_USER, { name: 'Nome Novo', email: 'hack@example.com' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
  })

  // ── Campos sensíveis — roles artist e admin ───────────────────────────────

  it('retorna 200 quando artist atualiza email', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    const request = makeRequest(ARTIST_USER, { email: 'novo@example.com' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).toHaveBeenCalledWith(
      ARTIST_USER.artistId,
      expect.objectContaining({ email: 'novo@example.com' }),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 200 quando admin atualiza whatsapp', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    const request = makeRequest(ADMIN_USER, { whatsapp: '+5511777777777' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).toHaveBeenCalledWith(
      ADMIN_USER.artistId,
      expect.objectContaining({ whatsapp: '+5511777777777' }),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
  })

  // ── Campos sensíveis não incluídos no payload ─────────────────────────────

  it('não inclui email no update quando não está no payload (mesmo para artist)', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    const request = makeRequest(ARTIST_USER, { name: 'Só o nome' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    const callArg = vi.mocked(update).mock.calls[0][1]
    expect(callArg).not.toHaveProperty('email')
    expect(callArg).not.toHaveProperty('whatsapp')
  })

  // ── Validação de schema ───────────────────────────────────────────────────

  it('retorna 422 quando o payload viola o schema Zod (email inválido)', async () => {
    const request = makeRequest(ARTIST_USER, { email: 'not-an-email' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando name é muito curto (menos de 2 caracteres)', async () => {
    const request = makeRequest(ARTIST_USER, { name: 'A' })
    const reply   = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 422 quando bio excede o limite de 5 itens', async () => {
    const request = makeRequest(ARTIST_USER, {
      bio: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
    })
    const reply = makeReply()

    await updateProfileHandler(request, reply)

    expect(update).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  // ── Ownership ─────────────────────────────────────────────────────────────

  it('sempre usa o artistId do AuthContext — nunca do body', async () => {
    vi.mocked(update).mockResolvedValue(UPDATED_PROFILE)

    // Body contém um artistId diferente — deve ser ignorado
    const request = makeRequest(ARTIST_USER, {
      name:     'Nome Novo',
      artistId: 'outro-artist-uuid',
    })
    const reply = makeReply()

    await updateProfileHandler(request, reply)

    // O update deve ter sido chamado com o artistId do AuthContext
    expect(update).toHaveBeenCalledWith('artist-uuid-001', expect.any(Object))
    expect(update).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })
})
