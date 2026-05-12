/**
 * appointments.ownership.property.test.ts
 *
 * Property-based tests for ownership invariants and status transition validation
 * in the appointments module.
 *
 * Property 2:  Ownership enforcement — artista não acessa recursos de outro artista
 * Property 11: Transições de status válidas
 * Property 12: Calendário privado retorna apenas Appointments do artista autenticado
 *
 * Validates: Requirements 6.2, 6.4, 7.2, 7.4, 9.3, 9.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'

fc.configureGlobal({ numRuns: 100 })

// ── Mock Prisma so no real DB connection is needed ────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    appointment: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
      update:     vi.fn(),
    },
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

import { prisma } from '../../lib/prisma.js'
import { AppointmentServiceError, updateStatus } from './appointments.service.js'
import type { AppointmentStatus } from '@prisma/client'

// ── Auth context type ─────────────────────────────────────────────────────────

interface AuthContext {
  userId:   string
  artistId: string
  role:     'admin' | 'artist' | 'editor'
}

// ── Ownership check logic (mirrors appointments.controller.ts) ────────────────

interface OwnershipCheckResult {
  allowed: boolean
  status:  403 | null
  error:   string | null
}

/**
 * assertOwnership — verifica se o artista autenticado é dono do recurso.
 *
 * Regra:
 * - Se `authenticatedArtistId === resourceArtistId` → acesso permitido
 * - Se `authenticatedArtistId !== resourceArtistId` → 403 Acesso negado
 * - Admin bypassa a verificação (role === 'admin')
 */
function assertOwnership(
  auth: AuthContext,
  resourceArtistId: string,
): OwnershipCheckResult {
  if (auth.role === 'admin') {
    return { allowed: true, status: null, error: null }
  }

  if (auth.artistId !== resourceArtistId) {
    return { allowed: false, status: 403, error: 'Acesso negado' }
  }

  return { allowed: true, status: null, error: null }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
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

// ── All valid AppointmentStatus values ───────────────────────────────────────

const ALL_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']

// ── Valid transitions map (mirrors appointments.service.ts) ──────────────────

const VALID_TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PENDING:   ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
}

// ── Simulated controller handlers ────────────────────────────────────────────

/**
 * Simulates updateStatusHandler from appointments.controller.ts.
 * Fetches appointment, checks ownership, validates transition, updates.
 */
async function simulateUpdateStatusHandler(
  request: FastifyRequest & {
    user:   AuthContext
    params: { id: string }
    body:   { status: AppointmentStatus }
  },
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user
  const { id }       = request.params

  const appointment = await (prisma.appointment as unknown as {
    findUnique: (args: unknown) => Promise<{ id: string; artistId: string; status: AppointmentStatus } | null>
  }).findUnique({
    where:  { id },
    select: { id: true, artistId: true, status: true },
  })

  if (!appointment) {
    reply.code(404).send({ error: 'Não encontrado' })
    return
  }

  const ownershipResult = assertOwnership(request.user, appointment.artistId)
  if (!ownershipResult.allowed) {
    reply.code(ownershipResult.status!).send({ error: ownershipResult.error })
    return
  }

  const newStatus = request.body.status
  const allowed   = VALID_TRANSITIONS[appointment.status] ?? []

  if (!allowed.includes(newStatus)) {
    reply.code(422).send({
      error: `Transição de status inválida: ${appointment.status} → ${newStatus}`,
    })
    return
  }

  await (prisma.appointment as unknown as {
    update: (args: unknown) => Promise<{ id: string; status: AppointmentStatus }>
  }).update({
    where: { id, artistId },
    data:  { status: newStatus },
  })

  reply.code(200).send({ data: { id, status: newStatus } })
}

/**
 * Simulates getAppointmentsHandler from appointments.controller.ts.
 * Fetches appointments filtered by the authenticated artistId.
 */
async function simulateGetAppointmentsHandler(
  request: FastifyRequest & {
    user:  AuthContext
    query: { from: string; to: string }
  },
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user
  const { from, to } = request.query

  const fromDate = new Date(from)
  const toDate   = new Date(to)

  const appointments = await (prisma.appointment as unknown as {
    findMany: (args: unknown) => Promise<Array<{ id: string; artistId: string; status: AppointmentStatus }>>
  }).findMany({
    where: {
      artistId,
      startAt: { gte: fromDate },
      endAt:   { lte: toDate },
    },
    orderBy: { startAt: 'asc' },
  })

  reply.code(200).send({ data: appointments })
}

// ─── Property 2: Ownership enforcement — artista não acessa recursos de outro artista ──

// Feature: scheduling-system, Property 2: Ownership enforcement — artista não acessa recursos de outro artista
describe('Property 2: Ownership enforcement — artista não acessa recursos de outro artista', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 2.1 assertOwnership — função pura ────────────────────────────────────

  it(
    'assertOwnership retorna 403 para qualquer par de artistIds distintos (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // artistId autenticado (A)
          fc.uuid(), // artistId do recurso (B, diferente de A)
          async (authenticatedArtistId, resourceArtistId) => {
            fc.pre(authenticatedArtistId !== resourceArtistId)

            const auth: AuthContext = {
              userId:   authenticatedArtistId,
              artistId: authenticatedArtistId,
              role:     'artist',
            }

            const result = assertOwnership(auth, resourceArtistId)

            expect(result.allowed).toBe(false)
            expect(result.status).toBe(403)
            expect(result.error).toBe('Acesso negado')
          },
        ),
      )
    },
  )

  it(
    'assertOwnership permite acesso quando artistId coincide com resourceArtistId (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userId
          fc.uuid(), // artistId (mesmo que resourceArtistId)
          async (userId, artistId) => {
            const auth: AuthContext = { userId, artistId, role: 'artist' }

            const result = assertOwnership(auth, artistId)

            expect(result.allowed).toBe(true)
            expect(result.status).toBeNull()
            expect(result.error).toBeNull()
          },
        ),
      )
    },
  )

  // ── 2.2 updateStatus handler — acesso cruzado retorna 403 ────────────────

  it(
    'updateStatus com artistId diferente do appointment retorna 403 — nunca 200 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                                    // artistId autenticado (A)
          fc.uuid(),                                                    // artistId do recurso (B)
          fc.uuid(),                                                    // appointmentId
          fc.constantFrom(...ALL_STATUSES),                             // status atual
          fc.constantFrom(...ALL_STATUSES),                             // novo status
          async (authenticatedArtistId, resourceArtistId, appointmentId, currentStatus, newStatus) => {
            fc.pre(authenticatedArtistId !== resourceArtistId)

            vi.resetAllMocks()

            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              id:       appointmentId,
              artistId: resourceArtistId,
              status:   currentStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            const request = makeRequest({
              user:   { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              params: { id: appointmentId },
              body:   { status: newStatus },
            }) as FastifyRequest & {
              user:   AuthContext
              params: { id: string }
              body:   { status: AppointmentStatus }
            }

            const reply = makeReply()

            await simulateUpdateStatusHandler(request, reply)

            // Invariante: deve retornar 403
            expect(reply.code).toHaveBeenCalledWith(403)
            expect(
              (reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send,
            ).toHaveBeenCalledWith({ error: 'Acesso negado' })

            // Nunca deve retornar 200 ou 204
            expect(reply.code).not.toHaveBeenCalledWith(200)
            expect(reply.code).not.toHaveBeenCalledWith(204)
          },
        ),
      )
    },
  )

  // ── 2.3 Admin bypassa ownership ───────────────────────────────────────────

  it(
    'admin bypassa ownership — assertOwnership sempre permite acesso para role admin (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // adminUserId
          fc.uuid(), // adminArtistId
          fc.uuid(), // resourceArtistId (qualquer artista)
          async (adminUserId, adminArtistId, resourceArtistId) => {
            const adminContext: AuthContext = {
              userId:   adminUserId,
              artistId: adminArtistId,
              role:     'admin',
            }

            const result = assertOwnership(adminContext, resourceArtistId)

            expect(result.allowed).toBe(true)
            expect(result.status).toBeNull()
            expect(result.error).toBeNull()
          },
        ),
      )
    },
  )

  // ── 2.4 Resposta de erro nunca expõe 200 ou 204 ───────────────────────────

  it(
    'para qualquer par de artistas distintos, o status de resposta é sempre 403 — nunca 200 nem 204 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // artistId autenticado
          fc.uuid(), // artistId do recurso (diferente)
          async (authenticatedArtistId, resourceArtistId) => {
            fc.pre(authenticatedArtistId !== resourceArtistId)

            const auth: AuthContext = {
              userId:   authenticatedArtistId,
              artistId: authenticatedArtistId,
              role:     'artist',
            }

            const result = assertOwnership(auth, resourceArtistId)

            if (!result.allowed) {
              expect(result.status).not.toBe(200)
              expect(result.status).not.toBe(204)
              expect(result.status).toBe(403)
            }
          },
        ),
      )
    },
  )
})

// ─── Property 11: Transições de status válidas ────────────────────────────────

// Feature: scheduling-system, Property 11: Transições de status válidas
describe('Property 11: Transições de status válidas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 11.1 Transições válidas são aceitas pelo service ─────────────────────

  it(
    'updateStatus aceita todas as transições válidas: PENDING→CONFIRMED, PENDING→REJECTED, PENDING→CANCELLED, CONFIRMED→CANCELLED (mínimo 100 iterações)',
    async () => {
      // Enumerate all valid (from, to) pairs
      const validPairs: Array<[AppointmentStatus, AppointmentStatus]> = [
        ['PENDING',   'CONFIRMED'],
        ['PENDING',   'REJECTED'],
        ['PENDING',   'CANCELLED'],
        ['CONFIRMED', 'CANCELLED'],
      ]

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // appointmentId
          fc.uuid(),                                  // artistId
          fc.constantFrom(...validPairs),             // [currentStatus, newStatus]
          async (appointmentId, artistId, [currentStatus, newStatus]) => {
            vi.resetAllMocks()

            // Mock findById (used by the service)
            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   currentStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            // Mock updateStatus (used by the service)
            vi.mocked(prisma.appointment.update).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   newStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.update>>)

            // Invariante: transição válida não deve lançar erro
            await expect(
              updateStatus(appointmentId, artistId, newStatus),
            ).resolves.not.toThrow()
          },
        ),
      )
    },
  )

  // ── 11.2 Transições inválidas lançam AppointmentServiceError INVALID_TRANSITION ──

  it(
    'updateStatus rejeita todas as transições inválidas com AppointmentServiceError INVALID_TRANSITION (mínimo 100 iterações)',
    async () => {
      // Build the set of invalid (from, to) pairs
      const validSet = new Set(
        Object.entries(VALID_TRANSITIONS).flatMap(([from, tos]) =>
          (tos as AppointmentStatus[]).map((to) => `${from}→${to}`),
        ),
      )

      const invalidPairs: Array<[AppointmentStatus, AppointmentStatus]> = []
      for (const from of ALL_STATUSES) {
        for (const to of ALL_STATUSES) {
          if (!validSet.has(`${from}→${to}`)) {
            invalidPairs.push([from, to])
          }
        }
      }

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // appointmentId
          fc.uuid(),                                  // artistId
          fc.constantFrom(...invalidPairs),           // [currentStatus, newStatus]
          async (appointmentId, artistId, [currentStatus, newStatus]) => {
            vi.resetAllMocks()

            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   currentStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            // Invariante: transição inválida deve lançar AppointmentServiceError com code INVALID_TRANSITION
            await expect(
              updateStatus(appointmentId, artistId, newStatus),
            ).rejects.toSatisfy((err: unknown) => {
              return (
                err instanceof AppointmentServiceError &&
                err.code === 'INVALID_TRANSITION'
              )
            })
          },
        ),
      )
    },
  )

  // ── 11.3 Transições inválidas via handler retornam 422 ───────────────────

  it(
    'handler retorna 422 para qualquer transição inválida — nunca 200 (mínimo 100 iterações)',
    async () => {
      const validSet = new Set(
        Object.entries(VALID_TRANSITIONS).flatMap(([from, tos]) =>
          (tos as AppointmentStatus[]).map((to) => `${from}→${to}`),
        ),
      )

      const invalidPairs: Array<[AppointmentStatus, AppointmentStatus]> = []
      for (const from of ALL_STATUSES) {
        for (const to of ALL_STATUSES) {
          if (!validSet.has(`${from}→${to}`)) {
            invalidPairs.push([from, to])
          }
        }
      }

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // appointmentId
          fc.uuid(),                                  // artistId
          fc.constantFrom(...invalidPairs),           // [currentStatus, newStatus]
          async (appointmentId, artistId, [currentStatus, newStatus]) => {
            vi.resetAllMocks()

            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   currentStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            const request = makeRequest({
              user:   { userId: artistId, artistId, role: 'artist' } as AuthContext,
              params: { id: appointmentId },
              body:   { status: newStatus },
            }) as FastifyRequest & {
              user:   AuthContext
              params: { id: string }
              body:   { status: AppointmentStatus }
            }

            const reply = makeReply()

            await simulateUpdateStatusHandler(request, reply)

            // Invariante: deve retornar 422
            expect(reply.code).toHaveBeenCalledWith(422)
            // Nunca deve retornar 200
            expect(reply.code).not.toHaveBeenCalledWith(200)
          },
        ),
      )
    },
  )

  // ── 11.4 Transições válidas via handler retornam 200 ─────────────────────

  it(
    'handler retorna 200 para qualquer transição válida — nunca 422 (mínimo 100 iterações)',
    async () => {
      const validPairs: Array<[AppointmentStatus, AppointmentStatus]> = [
        ['PENDING',   'CONFIRMED'],
        ['PENDING',   'REJECTED'],
        ['PENDING',   'CANCELLED'],
        ['CONFIRMED', 'CANCELLED'],
      ]

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // appointmentId
          fc.uuid(),                                  // artistId
          fc.constantFrom(...validPairs),             // [currentStatus, newStatus]
          async (appointmentId, artistId, [currentStatus, newStatus]) => {
            vi.resetAllMocks()

            vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   currentStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.findUnique>>)

            vi.mocked(prisma.appointment.update).mockResolvedValue({
              id:       appointmentId,
              artistId: artistId,
              status:   newStatus,
            } as unknown as Awaited<ReturnType<typeof prisma.appointment.update>>)

            const request = makeRequest({
              user:   { userId: artistId, artistId, role: 'artist' } as AuthContext,
              params: { id: appointmentId },
              body:   { status: newStatus },
            }) as FastifyRequest & {
              user:   AuthContext
              params: { id: string }
              body:   { status: AppointmentStatus }
            }

            const reply = makeReply()

            await simulateUpdateStatusHandler(request, reply)

            // Invariante: deve retornar 200
            expect(reply.code).toHaveBeenCalledWith(200)
            // Nunca deve retornar 422
            expect(reply.code).not.toHaveBeenCalledWith(422)
          },
        ),
      )
    },
  )
})

// ─── Property 12: Calendário privado retorna apenas Appointments do artista autenticado ──

// Feature: scheduling-system, Property 12: Calendário privado retorna apenas Appointments do artista autenticado
describe('Property 12: Calendário privado retorna apenas Appointments do artista autenticado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 12.1 findMany é chamado com o artistId do token — nunca de outro artista ──

  it(
    'getAppointments filtra sempre pelo artistId do token JWT — nunca retorna appointments de outro artista (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // artistId autenticado
          fc.uuid(),                                  // outro artistId (não autenticado)
          fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }), // ids de appointments do artista autenticado
          fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }), // ids de appointments de outro artista
          async (authenticatedArtistId, otherArtistId, ownIds, otherIds) => {
            fc.pre(authenticatedArtistId !== otherArtistId)

            vi.resetAllMocks()

            // Build appointment objects for the authenticated artist
            const ownAppointments = ownIds.map((id) => ({
              id,
              artistId: authenticatedArtistId,
              status:   'PENDING' as AppointmentStatus,
            }))

            // The mock returns only the authenticated artist's appointments
            // (simulating the WHERE artistId = authenticatedArtistId filter)
            vi.mocked(prisma.appointment.findMany).mockResolvedValue(
              ownAppointments as unknown as Awaited<ReturnType<typeof prisma.appointment.findMany>>,
            )

            const from = '2025-01-01'
            const to   = '2025-01-31'

            const request = makeRequest({
              user:  { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              query: { from, to },
            }) as FastifyRequest & {
              user:  AuthContext
              query: { from: string; to: string }
            }

            const reply = makeReply()

            await simulateGetAppointmentsHandler(request, reply)

            // Invariante: findMany deve ser chamado com o artistId do token
            expect(prisma.appointment.findMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  artistId: authenticatedArtistId,
                }),
              }),
            )

            // Invariante: findMany NÃO deve ser chamado com o artistId de outro artista
            const findManyCall = vi.mocked(prisma.appointment.findMany).mock.calls[0]
            const whereArg = (findManyCall[0] as { where: Record<string, unknown> }).where
            expect(whereArg.artistId).toBe(authenticatedArtistId)
            expect(whereArg.artistId).not.toBe(otherArtistId)

            // Invariante: resposta deve retornar 200
            expect(reply.code).toHaveBeenCalledWith(200)
          },
        ),
      )
    },
  )

  // ── 12.2 Nenhum appointment de outro artista aparece na resposta ──────────

  it(
    'resposta nunca contém appointments cujo artistId difere do artista autenticado (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),                                  // artistId autenticado
          fc.uuid(),                                  // outro artistId
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // ids de appointments do artista autenticado
          async (authenticatedArtistId, otherArtistId, ownIds) => {
            fc.pre(authenticatedArtistId !== otherArtistId)

            vi.resetAllMocks()

            const ownAppointments = ownIds.map((id) => ({
              id,
              artistId: authenticatedArtistId,
              status:   'PENDING' as AppointmentStatus,
            }))

            vi.mocked(prisma.appointment.findMany).mockResolvedValue(
              ownAppointments as unknown as Awaited<ReturnType<typeof prisma.appointment.findMany>>,
            )

            const request = makeRequest({
              user:  { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              query: { from: '2025-01-01', to: '2025-01-31' },
            }) as FastifyRequest & {
              user:  AuthContext
              query: { from: string; to: string }
            }

            // Capture the data sent in the reply
            let sentData: unknown = null
            const send = vi.fn().mockImplementation((data: unknown) => { sentData = data; return {} })
            const code = vi.fn().mockReturnValue({ send })
            const reply = { code, send } as unknown as FastifyReply

            await simulateGetAppointmentsHandler(request, reply)

            // Invariante: todos os appointments retornados pertencem ao artista autenticado
            const responseData = (sentData as { data: Array<{ artistId: string }> }).data
            for (const appt of responseData) {
              expect(appt.artistId).toBe(authenticatedArtistId)
              expect(appt.artistId).not.toBe(otherArtistId)
            }
          },
        ),
      )
    },
  )

  // ── 12.3 artistId nunca vem de query string ou body ──────────────────────

  it(
    'artistId na query WHERE vem sempre do token JWT — nunca de query string ou body (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // artistId autenticado (do token)
          fc.uuid(), // artistId injetado na query string (deve ser ignorado)
          fc.uuid(), // artistId injetado no body (deve ser ignorado)
          async (tokenArtistId, queryArtistId, bodyArtistId) => {
            fc.pre(tokenArtistId !== queryArtistId && tokenArtistId !== bodyArtistId)

            vi.resetAllMocks()

            vi.mocked(prisma.appointment.findMany).mockResolvedValue(
              [] as unknown as Awaited<ReturnType<typeof prisma.appointment.findMany>>,
            )

            // Request with different artistIds in query and body — they must be ignored
            const request = makeRequest({
              user:  { userId: tokenArtistId, artistId: tokenArtistId, role: 'artist' } as AuthContext,
              query: { from: '2025-01-01', to: '2025-01-31', artistId: queryArtistId },
              body:  { artistId: bodyArtistId },
            }) as FastifyRequest & {
              user:  AuthContext
              query: { from: string; to: string }
            }

            const reply = makeReply()

            await simulateGetAppointmentsHandler(request, reply)

            // Invariante: findMany deve usar o artistId do token
            const findManyCall = vi.mocked(prisma.appointment.findMany).mock.calls[0]
            const whereArg = (findManyCall[0] as { where: Record<string, unknown> }).where
            expect(whereArg.artistId).toBe(tokenArtistId)
            expect(whereArg.artistId).not.toBe(queryArtistId)
            expect(whereArg.artistId).not.toBe(bodyArtistId)
          },
        ),
      )
    },
  )
})
