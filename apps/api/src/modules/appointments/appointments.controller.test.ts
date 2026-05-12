/**
 * appointments.controller.test.ts
 *
 * Unit tests for appointments.controller.ts
 * Requirements: 6.4, 7.2, 7.4, 7.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  getAppointmentsHandler,
  updateStatusHandler,
  deleteAppointmentHandler,
} from './appointments.controller.js'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./appointments.repository.js', () => ({
  findByArtistAndPeriod: vi.fn(),
  findById:              vi.fn(),
  updateStatus:          vi.fn(),
  remove:                vi.fn(),
  findConflicts:         vi.fn(),
}))

// ── Mock service ──────────────────────────────────────────────────────────────
vi.mock('./appointments.service.js', () => ({
  updateStatus: vi.fn(),
}))

import {
  findByArtistAndPeriod,
  findById,
  remove,
} from './appointments.repository.js'

import { updateStatus as serviceUpdateStatus } from './appointments.service.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: 'admin' | 'artist' | 'editor' },
  query: Record<string, string> = {},
  body: unknown = {},
  params: Record<string, string> = {},
): FastifyRequest {
  return { user, query, body, params } as unknown as FastifyRequest
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ARTIST_USER  = { userId: 'user-001', artistId: 'artist-001', role: 'artist' as const }
const OTHER_ARTIST = { userId: 'user-002', artistId: 'artist-002', role: 'artist' as const }

const MOCK_APPOINTMENT = {
  id:             'appt-001',
  requesterName:  'João Silva',
  requesterEmail: 'joao@example.com',
  requesterPhone: '+5511999999999',
  serviceId:      null,
  startAt:        new Date('2024-06-10T14:00:00Z'),
  endAt:          new Date('2024-06-10T15:00:00Z'),
  status:         'PENDING' as const,
  notes:          null,
  requestCode:    'req-code-001',
}

const MOCK_APPOINTMENT_OWNERSHIP = {
  id:       'appt-001',
  artistId: 'artist-001',
  status:   'PENDING' as const,
}

const MOCK_APPOINTMENT_OWNERSHIP_CONFIRMED = {
  id:       'appt-002',
  artistId: 'artist-001',
  status:   'CONFIRMED' as const,
}

const VALID_QUERY = {
  from: '2024-06-01',
  to:   '2024-06-30',
}

// ─── GET /appointments?from&to ────────────────────────────────────────────────

describe('getAppointmentsHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com appointments apenas do artista autenticado', async () => {
    vi.mocked(findByArtistAndPeriod).mockResolvedValue([MOCK_APPOINTMENT])

    const request = makeRequest(ARTIST_USER, VALID_QUERY)
    const reply   = makeReply()

    await getAppointmentsHandler(request, reply)

    // Deve buscar apenas pelo artistId do token JWT
    expect(findByArtistAndPeriod).toHaveBeenCalledWith(
      'artist-001',
      expect.any(Date),
      expect.any(Date),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [MOCK_APPOINTMENT] })
  })

  it('retorna 200 com lista vazia quando artista não tem appointments no período', async () => {
    vi.mocked(findByArtistAndPeriod).mockResolvedValue([])

    const request = makeRequest(ARTIST_USER, VALID_QUERY)
    const reply   = makeReply()

    await getAppointmentsHandler(request, reply)

    expect(findByArtistAndPeriod).toHaveBeenCalledWith('artist-001', expect.any(Date), expect.any(Date))
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: [] })
  })

  it('usa o artistId do AuthContext — nunca de query string ou body', async () => {
    vi.mocked(findByArtistAndPeriod).mockResolvedValue([])

    // Mesmo que a query tivesse um artistId diferente, deve usar o do token
    const request = makeRequest(ARTIST_USER, { ...VALID_QUERY, artistId: 'outro-artist' })
    const reply   = makeReply()

    await getAppointmentsHandler(request, reply)

    expect(findByArtistAndPeriod).toHaveBeenCalledWith('artist-001', expect.any(Date), expect.any(Date))
    expect(findByArtistAndPeriod).not.toHaveBeenCalledWith('outro-artist', expect.any(Date), expect.any(Date))
  })

  it('retorna 422 quando período excede 60 dias', async () => {
    const request = makeRequest(ARTIST_USER, { from: '2024-01-01', to: '2024-04-01' })
    const reply   = makeReply()

    await getAppointmentsHandler(request, reply)

    expect(findByArtistAndPeriod).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })

  it('retorna 422 quando parâmetros from/to estão ausentes', async () => {
    const request = makeRequest(ARTIST_USER, {})
    const reply   = makeReply()

    await getAppointmentsHandler(request, reply)

    expect(findByArtistAndPeriod).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })
})

// ─── PATCH /appointments/:id/status ──────────────────────────────────────────

describe('updateStatusHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com appointment atualizado após transição válida PENDING → CONFIRMED', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)
    const updatedAppointment = { ...MOCK_APPOINTMENT_OWNERSHIP, status: 'CONFIRMED' as const }
    vi.mocked(serviceUpdateStatus).mockResolvedValue(updatedAppointment as unknown as ReturnType<typeof serviceUpdateStatus> extends Promise<infer T> ? T : never)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'CONFIRMED' },
      { id: 'appt-001' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(findById).toHaveBeenCalledWith('appt-001')
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ data: updatedAppointment })
  })

  it('retorna 200 com appointment atualizado após transição válida PENDING → REJECTED', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)
    const updatedAppointment = { ...MOCK_APPOINTMENT_OWNERSHIP, status: 'REJECTED' as const }
    vi.mocked(serviceUpdateStatus).mockResolvedValue(updatedAppointment as unknown as ReturnType<typeof serviceUpdateStatus> extends Promise<infer T> ? T : never)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'REJECTED' },
      { id: 'appt-001' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 200 com appointment atualizado após transição válida CONFIRMED → CANCELLED', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP_CONFIRMED)
    const updatedAppointment = { ...MOCK_APPOINTMENT_OWNERSHIP_CONFIRMED, status: 'CANCELLED' as const }
    vi.mocked(serviceUpdateStatus).mockResolvedValue(updatedAppointment as unknown as ReturnType<typeof serviceUpdateStatus> extends Promise<infer T> ? T : never)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'CANCELLED' },
      { id: 'appt-002' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(200)
  })

  it('retorna 422 quando transição de status é inválida (CONFIRMED → REJECTED)', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP_CONFIRMED)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'REJECTED' },
      { id: 'appt-002' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(serviceUpdateStatus).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Transição de status inválida') }))
  })

  it('retorna 422 quando transição de status é inválida (CANCELLED → CONFIRMED)', async () => {
    vi.mocked(findById).mockResolvedValue({
      id:       'appt-003',
      artistId: 'artist-001',
      status:   'CANCELLED' as const,
    })

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'CONFIRMED' },
      { id: 'appt-003' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(serviceUpdateStatus).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })

  it('retorna 403 quando artista tenta atualizar status de appointment de outro artista', async () => {
    // Appointment pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-002'
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)

    const request = makeRequest(
      OTHER_ARTIST,
      {},
      { status: 'CONFIRMED' },
      { id: 'appt-001' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(serviceUpdateStatus).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando appointment não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'CONFIRMED' },
      { id: 'appt-inexistente' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(serviceUpdateStatus).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
  })

  it('retorna 422 quando status enviado é inválido (valor desconhecido)', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)

    const request = makeRequest(
      ARTIST_USER,
      {},
      { status: 'INVALID_STATUS' },
      { id: 'appt-001' },
    )
    const reply = makeReply()

    await updateStatusHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(serviceUpdateStatus).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
  })
})

// ─── DELETE /appointments/:id ─────────────────────────────────────────────────

describe('deleteAppointmentHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 204 após deleção bem-sucedida do próprio appointment', async () => {
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)
    vi.mocked(remove).mockResolvedValue(undefined as unknown as ReturnType<typeof remove> extends Promise<infer T> ? T : never)

    const request = makeRequest(ARTIST_USER, {}, {}, { id: 'appt-001' })
    const reply   = makeReply()

    await deleteAppointmentHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(findById).toHaveBeenCalledWith('appt-001')
    expect(remove).toHaveBeenCalledWith('appt-001', 'artist-001')
    expect(reply.code).toHaveBeenCalledWith(204)
  })

  it('retorna 403 quando artista tenta deletar appointment de outro artista', async () => {
    // Appointment pertence a 'artist-001', OTHER_ARTIST tem artistId 'artist-002'
    vi.mocked(findById).mockResolvedValue(MOCK_APPOINTMENT_OWNERSHIP)

    const request = makeRequest(OTHER_ARTIST, {}, {}, { id: 'appt-001' })
    const reply   = makeReply()

    await deleteAppointmentHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({ error: 'Acesso negado' })
  })

  it('retorna 404 quando appointment não existe', async () => {
    vi.mocked(findById).mockResolvedValue(null)

    const request = makeRequest(ARTIST_USER, {}, {}, { id: 'appt-inexistente' })
    const reply   = makeReply()

    await deleteAppointmentHandler(
      request as FastifyRequest<{ Params: { id: string } }>,
      reply,
    )

    expect(remove).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(404)
  })
})
