/**
 * public-scheduling.controller.test.ts
 *
 * Unit tests for public-scheduling.controller.ts
 * Requirements: 3.7, 3.8, 4.3, 4.5, 4.6, 4.7, 5.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  getPublicAvailabilityHandler,
  createPublicAppointmentHandler,
  getPublicAppointmentStatusHandler,
} from './public-scheduling.controller.js'

// ── Mock service ──────────────────────────────────────────────────────────────
vi.mock('./public-scheduling.service.js', () => ({
  getPublicAvailability:        vi.fn(),
  createPublicAppointment:      vi.fn(),
  getAppointmentByRequestCode:  vi.fn(),
  PublicSchedulingError:        class PublicSchedulingError extends Error {
    constructor(
      public readonly code: 'NOT_FOUND' | 'CONFLICT' | 'ADVANCE_TOO_SHORT' | 'ADVANCE_TOO_LONG',
      message: string,
    ) {
      super(message)
      this.name = 'PublicSchedulingError'
    }
  },
}))

import {
  getPublicAvailability,
  createPublicAppointment,
  getAppointmentByRequestCode,
  PublicSchedulingError,
} from './public-scheduling.service.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeAvailabilityRequest(
  params: { artistId: string },
  query: Record<string, string> = {},
): FastifyRequest {
  return { params, query } as unknown as FastifyRequest
}

function makeCreateRequest(
  params: { artistId: string },
  body: unknown = {},
): FastifyRequest {
  return { params, body } as unknown as FastifyRequest
}

function makeStatusRequest(
  params: { requestCode: string },
): FastifyRequest {
  return { params } as unknown as FastifyRequest
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ARTIST_ID    = 'artist-uuid-001'
const REQUEST_CODE = 'req-code-uuid-001'

// Datas válidas: 48h no futuro e 30 dias no futuro
const now = Date.now()
const startAt48h  = new Date(now + 48 * 60 * 60 * 1000).toISOString()
const endAt48h    = new Date(now + 49 * 60 * 60 * 1000).toISOString()

const MOCK_SLOTS = [
  {
    startAt: new Date('2024-06-10T14:00:00Z'),
    endAt:   new Date('2024-06-10T15:00:00Z'),
  },
  {
    startAt: new Date('2024-06-10T15:00:00Z'),
    endAt:   new Date('2024-06-10T16:00:00Z'),
  },
]

const MOCK_AVAILABILITY_RESULT = {
  artistId: ARTIST_ID,
  timezone: 'America/Sao_Paulo',
  slots:    MOCK_SLOTS,
}

const MOCK_APPOINTMENT = {
  requestCode: REQUEST_CODE,
  status:      'PENDING' as const,
  startAt:     new Date(startAt48h),
  endAt:       new Date(endAt48h),
}

const VALID_CREATE_BODY = {
  requesterName:  'João Silva',
  requesterEmail: 'joao@example.com',
  startAt:        startAt48h,
  endAt:          endAt48h,
}

// ─── GET /public/artists/:artistId/availability ───────────────────────────────

describe('getPublicAvailabilityHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 com lista de slots sem autenticação', async () => {
    vi.mocked(getPublicAvailability).mockResolvedValue(MOCK_AVAILABILITY_RESULT)

    const request = makeAvailabilityRequest(
      { artistId: ARTIST_ID },
      { from: '2024-06-01', to: '2024-06-30' },
    )
    const reply = makeReply()

    await getPublicAvailabilityHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(getPublicAvailability).toHaveBeenCalledWith(
      ARTIST_ID,
      expect.any(Date),
      expect.any(Date),
    )
    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({
        artistId: ARTIST_ID,
        timezone: 'America/Sao_Paulo',
        slots:    MOCK_SLOTS,
      })
  })

  it('retorna 200 com lista vazia quando artista não possui regras ativas', async () => {
    vi.mocked(getPublicAvailability).mockResolvedValue({
      artistId: ARTIST_ID,
      timezone: 'America/Sao_Paulo',
      slots:    [],
    })

    const request = makeAvailabilityRequest(
      { artistId: ARTIST_ID },
      { from: '2024-06-01', to: '2024-06-30' },
    )
    const reply = makeReply()

    await getPublicAvailabilityHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith({
        artistId: ARTIST_ID,
        timezone: 'America/Sao_Paulo',
        slots:    [],
      })
  })

  it('retorna 422 quando período excede 60 dias', async () => {
    const request = makeAvailabilityRequest(
      { artistId: ARTIST_ID },
      { from: '2024-01-01', to: '2024-04-01' },
    )
    const reply = makeReply()

    await getPublicAvailabilityHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(getPublicAvailability).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })
})

// ─── POST /public/artists/:artistId/appointments ──────────────────────────────

describe('createPublicAppointmentHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 201 com requestCode quando slot está disponível', async () => {
    vi.mocked(createPublicAppointment).mockResolvedValue({
      appointment:  MOCK_APPOINTMENT,
      isIdempotent: false,
    })

    const request = makeCreateRequest({ artistId: ARTIST_ID }, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(createPublicAppointment).toHaveBeenCalledWith(ARTIST_ID, expect.objectContaining({
      requesterName:  'João Silva',
      requesterEmail: 'joao@example.com',
    }))
    expect(reply.code).toHaveBeenCalledWith(201)
    expect((reply.code(201) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ requestCode: REQUEST_CODE }))
  })

  it('retorna 409 quando slot está ocupado (CONFLICT)', async () => {
    vi.mocked(createPublicAppointment).mockRejectedValue(
      new PublicSchedulingError('CONFLICT', 'O horário solicitado não está mais disponível'),
    )

    const request = makeCreateRequest({ artistId: ARTIST_ID }, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(409)
    expect((reply.code(409) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
  })

  it('retorna 422 quando startAt está a menos de 24h do momento atual', async () => {
    vi.mocked(createPublicAppointment).mockRejectedValue(
      new PublicSchedulingError('ADVANCE_TOO_SHORT', 'startAt deve ser pelo menos 24 horas no futuro'),
    )

    // startAt em 12h no futuro — falha na validação do service
    const startAtSoon = new Date(now + 12 * 60 * 60 * 1000).toISOString()
    const endAtSoon   = new Date(now + 13 * 60 * 60 * 1000).toISOString()

    const request = makeCreateRequest({ artistId: ARTIST_ID }, {
      ...VALID_CREATE_BODY,
      startAt: startAtSoon,
      endAt:   endAtSoon,
    })
    const reply = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
  })

  it('retorna 422 quando startAt está a mais de 60 dias no futuro', async () => {
    vi.mocked(createPublicAppointment).mockRejectedValue(
      new PublicSchedulingError('ADVANCE_TOO_LONG', 'startAt deve ser no máximo 60 dias no futuro'),
    )

    // startAt em 90 dias no futuro — falha na validação do schema
    const startAtFar = new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString()
    const endAtFar   = new Date(now + 90 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()

    const request = makeCreateRequest({ artistId: ARTIST_ID }, {
      ...VALID_CREATE_BODY,
      startAt: startAtFar,
      endAt:   endAtFar,
    })
    const reply = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
  })

  it('retorna 200 com mesmo requestCode em requisição idempotente (mesmo artistId+startAt+email)', async () => {
    vi.mocked(createPublicAppointment).mockResolvedValue({
      appointment:  MOCK_APPOINTMENT,
      isIdempotent: true,
    })

    const request = makeCreateRequest({ artistId: ARTIST_ID }, VALID_CREATE_BODY)
    const reply   = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(200)
    expect((reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ requestCode: REQUEST_CODE }))
  })

  it('retorna 422 quando body é inválido (campos obrigatórios ausentes)', async () => {
    const request = makeCreateRequest({ artistId: ARTIST_ID }, {})
    const reply   = makeReply()

    await createPublicAppointmentHandler(
      request as FastifyRequest<{ Params: { artistId: string } }>,
      reply,
    )

    expect(createPublicAppointment).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(422)
    expect((reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: 'Dados inválidos' }))
  })
})

// ─── GET /public/appointments/:requestCode ────────────────────────────────────

describe('getPublicAppointmentStatusHandler', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('retorna 200 sem PII quando requestCode é válido', async () => {
    vi.mocked(getAppointmentByRequestCode).mockResolvedValue(MOCK_APPOINTMENT)

    const request = makeStatusRequest({ requestCode: REQUEST_CODE })
    const reply   = makeReply()

    await getPublicAppointmentStatusHandler(
      request as FastifyRequest<{ Params: { requestCode: string } }>,
      reply,
    )

    expect(getAppointmentByRequestCode).toHaveBeenCalledWith(REQUEST_CODE)
    expect(reply.code).toHaveBeenCalledWith(200)

    const sentPayload = (reply.code(200) as unknown as { send: ReturnType<typeof vi.fn> }).send.mock.calls[0]?.[0]

    // Deve conter apenas campos públicos
    expect(sentPayload).toHaveProperty('requestCode', REQUEST_CODE)
    expect(sentPayload).toHaveProperty('status')
    expect(sentPayload).toHaveProperty('startAt')
    expect(sentPayload).toHaveProperty('endAt')

    // Nunca deve expor PII
    expect(sentPayload).not.toHaveProperty('requesterName')
    expect(sentPayload).not.toHaveProperty('requesterEmail')
    expect(sentPayload).not.toHaveProperty('requesterPhone')
    expect(sentPayload).not.toHaveProperty('artistId')
    expect(sentPayload).not.toHaveProperty('notes')
  })

  it('retorna 404 quando requestCode não existe', async () => {
    vi.mocked(getAppointmentByRequestCode).mockRejectedValue(
      new PublicSchedulingError('NOT_FOUND', 'Solicitação não encontrada'),
    )

    const request = makeStatusRequest({ requestCode: 'codigo-invalido' })
    const reply   = makeReply()

    await getPublicAppointmentStatusHandler(
      request as FastifyRequest<{ Params: { requestCode: string } }>,
      reply,
    )

    expect(reply.code).toHaveBeenCalledWith(404)
    expect((reply.code(404) as unknown as { send: ReturnType<typeof vi.fn> }).send)
      .toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }))
  })
})
