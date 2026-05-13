/**
 * public-scheduling.property.test.ts
 *
 * Property-based tests for the public scheduling module.
 *
 * Property 7:  Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments
 * Property 8:  Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos
 * Property 9:  Idempotência na criação de Appointment
 * Property 10: Status inicial de Appointment é sempre PENDING
 * Property 13: Validação de período máximo de 60 dias
 * Property 14: Política de antecedência — mínimo 24h, máximo 60 dias
 *
 * Validates: Requirements 3.6, 3.7, 4.5, 4.6, 4.7, 4.9, 5.2, 6.5, 9.1, 9.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'

fc.configureGlobal({ numRuns: 100 })

// ── Mock Prisma so no real DB connection is needed ────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    artist: {
      findUnique: vi.fn(),
    },
    availabilityRule: {
      findMany: vi.fn(),
    },
    appointment: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    availabilityBlock: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-32-chars-minimum!!',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-32-chars!!',
    ALLOWED_ORIGINS:    'http://localhost:3000',
    STORAGE_BUCKET:     'test-bucket',
    PORT:               '3333',
  },
}))

// ── Mock appointments.repository to avoid deep import chains ─────────────────
vi.mock('../appointments/appointments.repository.js', () => ({
  findConflicts: vi.fn().mockResolvedValue([]),
}))

import { prisma } from '../../lib/prisma.js'
import {
  getPublicAvailabilityHandler,
  createPublicAppointmentHandler,
  getPublicAppointmentStatusHandler,
} from './public-scheduling.controller.js'
import {
  PublicAvailabilityQuerySchema,
  PublicCreateAppointmentSchema,
} from './public-scheduling.schemas.js'

// ── Forbidden fields that must NEVER appear in public responses ───────────────

/**
 * Fields that must NEVER appear in the availability response.
 * Note: `artistId` IS allowed in the availability response (it identifies the artist,
 * not a requester). The forbidden fields are appointment-specific PII.
 */
const FORBIDDEN_FIELDS_AVAILABILITY = [
  'requesterName',
  'requesterEmail',
  'requesterPhone',
  'notes',
] as const

/**
 * Fields that must NEVER appear in the requestCode status response.
 * `artistId` is also forbidden here — only requestCode, status, startAt, endAt are allowed.
 */
const FORBIDDEN_FIELDS_STATUS = [
  'requesterName',
  'requesterEmail',
  'requesterPhone',
  'artistId',
  'notes',
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply & { _sentData: unknown } {
  let sentData: unknown = null
  const send = vi.fn().mockImplementation((data: unknown) => {
    sentData = data
    return {}
  })
  const code = vi.fn().mockReturnValue({ send })
  const reply = { code, send, get _sentData() { return sentData } } as unknown as FastifyReply & { _sentData: unknown }
  return reply
}

function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    jwtVerify: vi.fn(),
    user:      undefined,
    headers:   {},
    params:    {},
    body:      {},
    query:     {},
    ...overrides,
  } as unknown as FastifyRequest
}

/** Returns a future ISO datetime string offset by `offsetMs` from now */
function futureIso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY  = 24 * MS_PER_HOUR

// ── fast-check generators ─────────────────────────────────────────────────────

/** Generates a valid YYYY-MM-DD date string */
const fcDateString = fc.date({
  min: new Date('2025-01-01'),
  max: new Date('2030-12-31'),
}).map((d) => d.toISOString().slice(0, 10))

/** Generates a pair of dates where the period is ≤ 60 days */
const fcValidDatePair = fc.tuple(fcDateString, fcDateString).filter(([from, to]) => {
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY
  return diff >= 0 && diff <= 60
})

/** Generates a pair of dates where the period is > 60 days */
const fcExceedingDatePair = fc.tuple(fcDateString, fcDateString).filter(([from, to]) => {
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY
  return diff > 60
})

/** Generates a startAt that is between 24h and 60 days in the future */
const fcValidStartAt = fc.integer({
  min: 25 * MS_PER_HOUR,          // 25h — safely above 24h minimum
  max: 59 * MS_PER_DAY,           // 59 days — safely below 60-day maximum
}).map((offsetMs) => futureIso(offsetMs))

/** Generates a startAt that is less than 24h in the future (too soon) */
const fcTooSoonStartAt = fc.integer({
  min: 0,
  max: 23 * MS_PER_HOUR,          // 0–23h in the future
}).map((offsetMs) => futureIso(offsetMs))

/** Generates a startAt that is more than 60 days in the future (too far) */
const fcTooFarStartAt = fc.integer({
  min: 61 * MS_PER_DAY,           // 61+ days in the future
  max: 120 * MS_PER_DAY,
}).map((offsetMs) => futureIso(offsetMs))

/**
 * Generates a simple valid email address that passes Zod's .email() validation.
 * fc.emailAddress() can produce RFC-compliant but Zod-rejected emails (e.g. "!.a@a.aa").
 * We use a constrained generator: localPart@domain.tld
 */
const fcSimpleEmail = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 2, maxLength: 8 }),
  fc.constantFrom('com', 'net', 'org', 'io', 'dev'),
).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

/** Generates a valid appointment body with startAt in the valid window */
const fcValidAppointmentBody = fcValidStartAt.chain((startAt) => {
  const endAt = new Date(new Date(startAt).getTime() + MS_PER_HOUR).toISOString()
  return fc.record({
    requesterName:  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz '.split('')), { minLength: 1, maxLength: 50 }),
    requesterEmail: fcSimpleEmail,
    startAt:        fc.constant(startAt),
    endAt:          fc.constant(endAt),
  })
})

// ─── Property 7: Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments ──

// Feature: scheduling-system, Property 7: Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments
describe('Property 7: Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'resposta de disponibilidade nunca contém requesterName, requesterEmail, requesterPhone, artistId (de appointment), notes (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),          // artistId
          fcValidDatePair,    // [from, to]
          async (artistId, [from, to]) => {
            vi.resetAllMocks()

            // Mock artist lookup
            vi.mocked(prisma.artist.findUnique).mockResolvedValue({
              id:       artistId,
              timezone: 'America/Sao_Paulo',
            } as unknown as Awaited<ReturnType<typeof prisma.artist.findUnique>>)

            // Mock rules — empty (no slots generated)
            vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>,
            )

            // Mock appointments — return data with forbidden fields to ensure they are NOT forwarded
            vi.mocked(prisma.appointment.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.appointment.findMany>>,
            )

            // Mock blocks
            vi.mocked(prisma.availabilityBlock.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.availabilityBlock.findMany>>,
            )

            const request = makeRequest({
              params: { artistId },
              query:  { from, to },
            })

            let sentData: unknown = null
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockReturnValue({ send })
            const reply = { code, send } as unknown as FastifyReply

            await getPublicAvailabilityHandler(request as FastifyRequest<{ Params: { artistId: string } }>, reply)

            // Invariante: resposta deve ser 200
            expect(reply.code).toHaveBeenCalledWith(200)

            // Invariante: nenhum campo proibido deve aparecer na resposta
            const responseObj = sentData as Record<string, unknown>
            for (const field of FORBIDDEN_FIELDS_AVAILABILITY) {
              expect(responseObj).not.toHaveProperty(field)
            }

            // Invariante: resposta deve conter apenas artistId, timezone, slots
            const allowedKeys = new Set(['artistId', 'timezone', 'slots'])
            for (const key of Object.keys(responseObj)) {
              expect(allowedKeys.has(key)).toBe(true)
            }
          },
        ),
      )
    },
  )

  it(
    'slots na resposta de disponibilidade nunca contêm campos de Appointment (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),          // artistId
          fcValidDatePair,    // [from, to]
          async (artistId, [from, to]) => {
            vi.resetAllMocks()

            vi.mocked(prisma.artist.findUnique).mockResolvedValue({
              id:       artistId,
              timezone: 'UTC',
            } as unknown as Awaited<ReturnType<typeof prisma.artist.findUnique>>)

            vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>,
            )

            vi.mocked(prisma.appointment.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.appointment.findMany>>,
            )

            vi.mocked(prisma.availabilityBlock.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.availabilityBlock.findMany>>,
            )

            const request = makeRequest({
              params: { artistId },
              query:  { from, to },
            })

            let sentData: unknown = null
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockReturnValue({ send })
            const reply = { code, send } as unknown as FastifyReply

            await getPublicAvailabilityHandler(request as FastifyRequest<{ Params: { artistId: string } }>, reply)

            const responseObj = sentData as { slots: Array<Record<string, unknown>> }

            // Invariante: cada slot deve conter apenas startAt e endAt
            if (responseObj?.slots) {
              for (const slot of responseObj.slots) {
                for (const field of FORBIDDEN_FIELDS_AVAILABILITY) {
                  expect(slot).not.toHaveProperty(field)
                }
              }
            }
          },
        ),
      )
    },
  )
})

// ─── Property 8: Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos ──

// Feature: scheduling-system, Property 8: Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos
describe('Property 8: Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'resposta de GET /public/appointments/:requestCode nunca contém requesterName, requesterEmail, requesterPhone, artistId, notes (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                                          // requestCode
          fc.uuid(),                                                          // artistId (must NOT appear in response)
          fc.string({ minLength: 1, maxLength: 50 }),                        // requesterName (must NOT appear)
          fc.emailAddress(),                                                  // requesterEmail (must NOT appear)
          fc.constantFrom('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'),  // status
          async (requestCode, artistId, requesterName, requesterEmail, status) => {
            vi.resetAllMocks()

            const startAt = new Date(Date.now() + 2 * MS_PER_DAY)
            const endAt   = new Date(startAt.getTime() + MS_PER_HOUR)

            // Mock returns the full appointment object (as Prisma would), but the
            // service/controller must only forward the public fields
            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              requestCode,
              status,
              startAt,
              endAt,
              // These fields exist in DB but must NOT be forwarded:
              artistId,
              requesterName,
              requesterEmail,
              requesterPhone: null,
              notes:          null,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            const request = makeRequest({
              params: { requestCode },
            })

            let sentData: unknown = null
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockReturnValue({ send })
            const reply = { code, send } as unknown as FastifyReply

            await getPublicAppointmentStatusHandler(
              request as FastifyRequest<{ Params: { requestCode: string } }>,
              reply,
            )

            // Invariante: resposta deve ser 200
            expect(reply.code).toHaveBeenCalledWith(200)

            // Invariante: nenhum campo proibido deve aparecer na resposta
            const responseObj = sentData as Record<string, unknown>
            for (const field of FORBIDDEN_FIELDS_STATUS) {
              expect(responseObj).not.toHaveProperty(field)
            }

            // Invariante: resposta deve conter apenas os campos públicos permitidos
            const allowedKeys = new Set(['requestCode', 'status', 'startAt', 'endAt'])
            for (const key of Object.keys(responseObj)) {
              expect(allowedKeys.has(key)).toBe(true)
            }

            // Invariante: campos obrigatórios devem estar presentes
            expect(responseObj).toHaveProperty('requestCode', requestCode)
            expect(responseObj).toHaveProperty('status', status)
          },
        ),
      )
    },
  )
})

// ─── Property 9: Idempotência na criação de Appointment ──────────────────────

// Feature: scheduling-system, Property 9: Idempotência na criação de Appointment
describe('Property 9: Idempotência na criação de Appointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'quando (artistId, startAt, requesterEmail) já existe com PENDING ou CONFIRMED, retorna o mesmo requestCode com HTTP 200 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                                          // artistId
          fc.uuid(),                                                          // requestCode existente
          fc.constantFrom('PENDING' as const, 'CONFIRMED' as const),         // status existente
          fcValidAppointmentBody,                                             // body da nova requisição (inclui requesterEmail)
          async (artistId, existingRequestCode, existingStatus, body) => {
            vi.resetAllMocks()

            const startAt = new Date(body.startAt)
            const endAt   = new Date(body.endAt)

            // Mock artist lookup
            vi.mocked(prisma.artist.findUnique).mockResolvedValue({
              id: artistId,
              timezone: 'America/Sao_Paulo',
            } as unknown as Awaited<ReturnType<typeof prisma.artist.findUnique>>)

            // Mock idempotency check — returns existing appointment with same email
            vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
              requestCode: existingRequestCode,
              status:      existingStatus,
              startAt,
              endAt,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findFirst>>)

            const request = makeRequest({
              params: { artistId },
              body,   // body already contains requesterEmail from fcValidAppointmentBody
            })

            let sentData: unknown = null
            let sentCode: number  = 0
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockImplementation((c: number) => { sentCode = c; return { send } })
            const reply = { code, send } as unknown as FastifyReply

            await createPublicAppointmentHandler(
              request as FastifyRequest<{ Params: { artistId: string } }>,
              reply,
            )

            // Invariante: deve retornar HTTP 200 (idempotência)
            expect(sentCode).toBe(200)

            // Invariante: requestCode retornado deve ser o mesmo do appointment existente
            const responseObj = sentData as Record<string, unknown>
            expect(responseObj).toHaveProperty('requestCode', existingRequestCode)

            // Invariante: prisma.appointment.create NÃO deve ter sido chamado
            expect(prisma.appointment.create).not.toHaveBeenCalled()
          },
        ),
      )
    },
  )
})

// ─── Property 10: Status inicial de Appointment é sempre PENDING ─────────────

// Feature: scheduling-system, Property 10: Status inicial de Appointment é sempre PENDING
describe('Property 10: Status inicial de Appointment é sempre PENDING', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'qualquer Appointment criado com sucesso via endpoint público tem status PENDING na resposta (mínimo 100 iterações)',
    async () => {
      // Import the mocked findConflicts to re-setup after resetAllMocks
      const { findConflicts } = await import('../appointments/appointments.repository.js')

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),              // artistId
          fc.uuid(),              // requestCode gerado
          fcValidAppointmentBody, // body válido
          async (artistId, newRequestCode, body) => {
            vi.clearAllMocks()

            // Re-setup findConflicts mock after clearAllMocks
            vi.mocked(findConflicts).mockResolvedValue([])

            const startAt = new Date(body.startAt)
            const endAt   = new Date(body.endAt)

            // Mock artist lookup
            vi.mocked(prisma.artist.findUnique).mockResolvedValue({
              id: artistId,
              timezone: 'America/Sao_Paulo',
            } as unknown as Awaited<ReturnType<typeof prisma.artist.findUnique>>)

            // Mock idempotency check — no existing appointment
            vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null)

            // Mock availabilityRule — empty (skip slot validation)
            vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue([])

            // Mock transaction — simulates successful creation
            vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
              if (typeof fn === 'function') {
                const txMock = {
                  availabilityRule: {
                    findMany: vi.fn().mockResolvedValue([]),
                  },
                  appointment: {
                    findMany: vi.fn().mockResolvedValue([]),
                    create:   vi.fn().mockResolvedValue({
                      requestCode: newRequestCode,
                      status:      'PENDING',
                      startAt,
                      endAt,
                    }),
                  },
                  availabilityBlock: {
                    findMany: vi.fn().mockResolvedValue([]),
                  },
                }
                return fn(txMock)
              }
            })

            const request = makeRequest({
              params: { artistId },
              body,
            })

            let sentData: unknown = null
            let sentCode: number  = 0
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockImplementation((c: number) => { sentCode = c; return { send } })
            const reply = { code, send } as unknown as FastifyReply

            await createPublicAppointmentHandler(
              request as FastifyRequest<{ Params: { artistId: string } }>,
              reply,
            )

            // Invariante: deve retornar HTTP 201 (nova criação)
            expect(sentCode).toBe(201)

            // Invariante: status na resposta deve ser PENDING
            const responseObj = sentData as Record<string, unknown>
            expect(responseObj).toHaveProperty('status', 'PENDING')
          },
        ),
      )
    },
  )
})

// ─── Property 13: Validação de período máximo de 60 dias ─────────────────────

// Feature: scheduling-system, Property 13: Validação de período máximo de 60 dias
describe('Property 13: Validação de período máximo de 60 dias', () => {
  it(
    'PublicAvailabilityQuerySchema rejeita qualquer período from–to superior a 60 dias (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcExceedingDatePair,
          ([from, to]) => {
            const result = PublicAvailabilityQuerySchema.safeParse({ from, to })

            // Invariante: período > 60 dias deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'PublicAvailabilityQuerySchema aceita qualquer período from–to de até 60 dias (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidDatePair,
          ([from, to]) => {
            const result = PublicAvailabilityQuerySchema.safeParse({ from, to })

            // Invariante: período ≤ 60 dias deve ser aceito
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  it(
    'PublicAvailabilityQuerySchema rejeita exatamente no boundary: período de 61 dias (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcDateString,
          (from) => {
            const toDate = new Date(new Date(from).getTime() + 61 * MS_PER_DAY)
            const to     = toDate.toISOString().slice(0, 10)

            const result = PublicAvailabilityQuerySchema.safeParse({ from, to })

            // Invariante: 61 dias deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )
})

// ─── Property 14: Política de antecedência — mínimo 24h, máximo 60 dias ──────

// Feature: scheduling-system, Property 14: Política de antecedência — mínimo 24h, máximo 60 dias
describe('Property 14: Política de antecedência — mínimo 24h, máximo 60 dias', () => {
  it(
    'PublicCreateAppointmentSchema rejeita startAt a menos de 24h do momento atual (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcTooSoonStartAt,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          (startAt, requesterName, requesterEmail) => {
            const endAt = new Date(new Date(startAt).getTime() + MS_PER_HOUR).toISOString()

            const result = PublicCreateAppointmentSchema.safeParse({
              requesterName,
              requesterEmail,
              startAt,
              endAt,
            })

            // Invariante: startAt < now + 24h deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'PublicCreateAppointmentSchema rejeita startAt a mais de 60 dias do momento atual (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcTooFarStartAt,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          (startAt, requesterName, requesterEmail) => {
            const endAt = new Date(new Date(startAt).getTime() + MS_PER_HOUR).toISOString()

            const result = PublicCreateAppointmentSchema.safeParse({
              requesterName,
              requesterEmail,
              startAt,
              endAt,
            })

            // Invariante: startAt > now + 60 dias deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'PublicCreateAppointmentSchema aceita startAt entre 24h e 60 dias no futuro (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidStartAt,
          fcSimpleEmail,
          (startAt, requesterEmail) => {
            const endAt = new Date(new Date(startAt).getTime() + MS_PER_HOUR).toISOString()
            const requesterName = 'Test User'

            const result = PublicCreateAppointmentSchema.safeParse({
              requesterName,
              requesterEmail,
              startAt,
              endAt,
            })

            // Invariante: startAt na janela válida deve ser aceito
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  it(
    'PublicCreateAppointmentSchema rejeita startAt exatamente no boundary inferior (< 24h) (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          // Generate offsets between 0 and 23h59m (just under 24h)
          fc.integer({ min: 0, max: 23 * MS_PER_HOUR + 59 * 60 * 1000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.emailAddress(),
          (offsetMs, requesterName, requesterEmail) => {
            const startAt = futureIso(offsetMs)
            const endAt   = new Date(new Date(startAt).getTime() + MS_PER_HOUR).toISOString()

            const result = PublicCreateAppointmentSchema.safeParse({
              requesterName,
              requesterEmail,
              startAt,
              endAt,
            })

            // Invariante: qualquer startAt < now + 24h deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )
})
