/**
 * availability.controller.test.ts
 *
 * Unit tests for availability.controller.ts
 * Requirements: 1.3, 1.4, 1.6, 2.3, 2.4, 2.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
  createBlockHandler,
} from './availability.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./availability.repository.js', () => ({
  findRulesByArtist:  vi.fn(),
  findRuleById:       vi.fn(),
  createRule:         vi.fn(),
  updateRule:         vi.fn(),
  deleteRule:         vi.fn(),
  findBlocksByArtist: vi.fn(),
  findBlockById:      vi.fn(),
  createBlock:        vi.fn(),
  updateBlock:        vi.fn(),
  deleteBlock:        vi.fn(),
}))

import {
  findRuleById,
  createRule,
  deleteRule,
  findBlockById,
  createBlock,
} from './availability.repository.js'

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
const OTHER_ARTIST = { userId: 'user-002', artistId: 'artist-002', role: 'artist' as const }

const MOCK_RULE = {
  id:          'rule-001',
  artistId:    'artist-001',
  weekday:     1,
  startTime:   '09:00',
  endTime:     '18:00',
  slotMinutes: 60,
  active:      true,
  createdAt:   new Date('2024-01-01T00:00:00Z'),
  updatedAt:   new Date('2024-01-01T00:00:00Z'),
}

const MOCK_RULE_OWNERSHIP = {
  id:       'rule-001',
  artistId: 'artist-001',
}

const MOCK_BLOCK = {
  id:        'block-001',
  artistId:  'artist-001',
  startAt:   new Date('2024-06-01T10:00:00Z'),
  endAt:     new Date('2024-06-01T12:00:00Z'),
  reason:    'Consulta médica' as string | null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

const MOCK_BLOCK_OWNERSHIP = {
  id:       'block-001',
  artistId: 'artist-001',
}

const VALID_RULE_BODY = {
  weekday:     1,
  startTime:   '09:00',
  endTime:     '18:00',
  slotMinutes: 60,
  active:      true,
}

const VALID_BLOCK_BODY = {
  startAt: '2024-06-01T10:00:00.000Z',
  endAt:   '2024-06-01T12:00:00.000Z',
  reason:  'Consulta médica',
}

// ─── POST /availability-rules ─────────────────────────────────────────────────

describe('createRuleHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 201 com { data } após criação bem-sucedida com dados válidos', async () => {
    vi.mocked(createRule).mockResolvedValue(MOCK_RULE as unknown as typeof MOCK_RULE)

    const request = makeRequest(ARTIST_USER, VALID_RULE_BODY)
    const reply   = makeReply()

    await createRuleHandler(request, reply)

    expect(createRule).toHaveBeenCalledWith('artist-001', expect.objectContaining({
      weekday:     1,
      startTime:   '09:00',
      endTime:     '18:00',
      slotMinutes: 60,
    }))
    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_RULE })
  })

  it('retorna 422 quando startTime >= endTime (startTime igual a endTime)', async () => {
    const invalidBody = { ...VALID_RULE_BODY, startTime: '09:00', endTime: '09:00' }
    const request = makeRequest(ARTIST_USER, invalidBody)
    const reply   = makeReply()

    await createRuleHandler(request, reply)

    expect(createRule).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando startTime > endTime', async () => {
    const invalidBody = { ...VALID_RULE_BODY, startTime: '18:00', endTime: '09:00' }
    const request = makeRequest(ARTIST_USER, invalidBody)
    const reply   = makeReply()

    await createRuleHandler(request, reply)

    expect(createRule).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('usa o artistId do AuthContext — nunca do body da requisição', async () => {
    vi.mocked(createRule).mockResolvedValue(MOCK_RULE as unknown as typeof MOCK_RULE)

    const bodyWithArtistId = { ...VALID_RULE_BODY, artistId: 'outro-artist-uuid' }
    const request = makeRequest(ARTIST_USER, bodyWithArtistId)
    const reply   = makeReply()

    await createRuleHandler(request, reply)

    expect(createRule).toHaveBeenCalledWith('artist-001', expect.any(Object))
    expect(createRule).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })
})

// ─── PATCH /availability-rules/:id ───────────────────────────────────────────

describe('updateRuleHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 403 quando artista tenta atualizar regra de outro artista', async () => {
    // Regra pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-002'
    vi.mocked(findRuleById).mockResolvedValue(MOCK_RULE_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, { active: false }, { id: 'rule-001' })
    const reply   = makeReply()

    await updateRuleHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })
})

// ─── DELETE /availability-rules/:id ──────────────────────────────────────────

describe('deleteRuleHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 403 quando artista tenta deletar regra de outro artista', async () => {
    // Regra pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-002'
    vi.mocked(findRuleById).mockResolvedValue(MOCK_RULE_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, {}, { id: 'rule-001' })
    const reply   = makeReply()

    await deleteRuleHandler(request as FastifyRequest<{ Params: { id: string } }>, reply)

    expect(deleteRule).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })
})

// ─── POST /availability-blocks ────────────────────────────────────────────────

describe('createBlockHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 422 quando startAt >= endAt (startAt igual a endAt)', async () => {
    const sameTime = '2024-06-01T10:00:00.000Z'
    const invalidBody = { ...VALID_BLOCK_BODY, startAt: sameTime, endAt: sameTime }
    const request = makeRequest(ARTIST_USER, invalidBody)
    const reply   = makeReply()

    await createBlockHandler(request, reply)

    expect(createBlock).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando startAt > endAt', async () => {
    const invalidBody = {
      ...VALID_BLOCK_BODY,
      startAt: '2024-06-01T12:00:00.000Z',
      endAt:   '2024-06-01T10:00:00.000Z',
    }
    const request = makeRequest(ARTIST_USER, invalidBody)
    const reply   = makeReply()

    await createBlockHandler(request, reply)

    expect(createBlock).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 201 com { data } após criação bem-sucedida com dados válidos', async () => {
    vi.mocked(createBlock).mockResolvedValue(MOCK_BLOCK as unknown as typeof MOCK_BLOCK)

    const request = makeRequest(ARTIST_USER, VALID_BLOCK_BODY)
    const reply   = makeReply()

    await createBlockHandler(request, reply)

    expect(createBlock).toHaveBeenCalledWith('artist-001', expect.objectContaining({
      startAt: VALID_BLOCK_BODY.startAt,
      endAt:   VALID_BLOCK_BODY.endAt,
    }))
    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: MOCK_BLOCK })
  })

  it('usa o artistId do AuthContext — nunca do body da requisição', async () => {
    vi.mocked(createBlock).mockResolvedValue(MOCK_BLOCK as unknown as typeof MOCK_BLOCK)

    const bodyWithArtistId = { ...VALID_BLOCK_BODY, artistId: 'outro-artist-uuid' }
    const request = makeRequest(ARTIST_USER, bodyWithArtistId)
    const reply   = makeReply()

    await createBlockHandler(request, reply)

    expect(createBlock).toHaveBeenCalledWith('artist-001', expect.any(Object))
    expect(createBlock).not.toHaveBeenCalledWith('outro-artist-uuid', expect.any(Object))
  })
})
