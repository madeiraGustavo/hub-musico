/**
 * availability.validation.property.test.ts
 *
 * Property-based tests for ownership invariants and temporal validation
 * in the availability module.
 *
 * Property 1: Ownership invariant — criação sempre associa ao artista autenticado
 * Property 2: Ownership enforcement — artista não acessa recursos de outro artista
 * Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt
 *
 * Validates: Requirements 1.2, 1.3, 1.6, 2.2, 2.3, 2.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'

fc.configureGlobal({ numRuns: 100 })

// ── Mock Prisma so no real DB connection is needed ────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    availabilityRule: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    availabilityBlock: {
      findUnique: vi.fn(),
      create:     vi.fn(),
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
import {
  CreateAvailabilityRuleSchema,
  UpdateAvailabilityRuleSchema,
  CreateAvailabilityBlockSchema,
  UpdateAvailabilityBlockSchema,
} from './availability.schemas.js'

// ── Auth context type ─────────────────────────────────────────────────────────

interface AuthContext {
  userId:   string
  artistId: string
  role:     'admin' | 'artist' | 'editor'
}

// ── Ownership check logic (mirrors availability.controller.ts) ────────────────

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
    ...overrides,
  } as unknown as FastifyRequest
}

// ── Simulated controller handlers (mirrors availability.controller.ts) ─────────
//
// Property 1 handler: createRule/createBlock — artistId always comes from AuthContext
// Property 2 handler: updateRule/updateBlock — ownership enforced before mutation

async function simulateCreateRuleHandler(
  request: FastifyRequest & { user: AuthContext; body: Record<string, unknown> },
  reply: FastifyReply,
): Promise<{ artistId: string } | null> {
  const { artistId } = request.user

  const parsed = CreateAvailabilityRuleSchema.safeParse(request.body)
  if (!parsed.success) {
    reply.code(422).send({ error: 'Dados inválidos' })
    return null
  }

  const created = await (prisma.availabilityRule as unknown as {
    create: (args: unknown) => Promise<{ id: string; artistId: string }>
  }).create({
    data: { artistId, ...parsed.data },
  })

  reply.code(201).send({ data: created })
  return created
}

async function simulateCreateBlockHandler(
  request: FastifyRequest & { user: AuthContext; body: Record<string, unknown> },
  reply: FastifyReply,
): Promise<{ artistId: string } | null> {
  const { artistId } = request.user

  const parsed = CreateAvailabilityBlockSchema.safeParse(request.body)
  if (!parsed.success) {
    reply.code(422).send({ error: 'Dados inválidos' })
    return null
  }

  const created = await (prisma.availabilityBlock as unknown as {
    create: (args: unknown) => Promise<{ id: string; artistId: string }>
  }).create({
    data: { artistId, ...parsed.data },
  })

  reply.code(201).send({ data: created })
  return created
}

async function simulateUpdateRuleHandler(
  request: FastifyRequest & { user: AuthContext; params: { id: string }; body: Record<string, unknown> },
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user
  const { id } = request.params

  const rule = await (prisma.availabilityRule as unknown as {
    findUnique: (args: unknown) => Promise<{ id: string; artistId: string } | null>
  }).findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })

  if (!rule) {
    reply.code(404).send({ error: 'Não encontrado' })
    return
  }

  const result = assertOwnership(request.user, rule.artistId)
  if (!result.allowed) {
    reply.code(result.status!).send({ error: result.error })
    return
  }

  reply.code(200).send({ data: { id, artistId } })
}

async function simulateUpdateBlockHandler(
  request: FastifyRequest & { user: AuthContext; params: { id: string }; body: Record<string, unknown> },
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user
  const { id } = request.params

  const block = await (prisma.availabilityBlock as unknown as {
    findUnique: (args: unknown) => Promise<{ id: string; artistId: string } | null>
  }).findUnique({
    where:  { id },
    select: { id: true, artistId: true },
  })

  if (!block) {
    reply.code(404).send({ error: 'Não encontrado' })
    return
  }

  const result = assertOwnership(request.user, block.artistId)
  if (!result.allowed) {
    reply.code(result.status!).send({ error: result.error })
    return
  }

  reply.code(200).send({ data: { id, artistId } })
}

// ── fast-check generators ─────────────────────────────────────────────────────

/** Generates a valid HH:MM time string */
const fcTime = fc.tuple(
  fc.integer({ min: 0, max: 23 }),
  fc.integer({ min: 0, max: 59 }),
).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)

/** Generates a pair of times where startTime < endTime */
const fcValidTimePair = fc.tuple(fcTime, fcTime).filter(([s, e]) => s < e)

/** Generates a pair of times where startTime >= endTime (invalid) */
const fcInvalidTimePair = fc.tuple(fcTime, fcTime).filter(([s, e]) => s >= e)

/** Generates a valid ISO 8601 datetime string */
const fcIsoDatetime = fc.date({
  min: new Date('2020-01-01T00:00:00Z'),
  max: new Date('2030-12-31T23:59:59Z'),
}).map((d) => d.toISOString())

/** Generates a pair of datetimes where startAt < endAt */
const fcValidDatetimePair = fc.tuple(fcIsoDatetime, fcIsoDatetime).filter(
  ([s, e]) => new Date(s) < new Date(e),
)

/** Generates a pair of datetimes where startAt >= endAt (invalid) */
const fcInvalidDatetimePair = fc.tuple(fcIsoDatetime, fcIsoDatetime).filter(
  ([s, e]) => new Date(s) >= new Date(e),
)

/** Generates a valid CreateAvailabilityRuleBody */
const fcValidRuleBody = fcValidTimePair.chain(([startTime, endTime]) =>
  fc.record({
    weekday:     fc.integer({ min: 0, max: 6 }),
    startTime:   fc.constant(startTime),
    endTime:     fc.constant(endTime),
    slotMinutes: fc.integer({ min: 1, max: 120 }),
    active:      fc.boolean(),
  }),
)

// ─── Property 1: Ownership invariant — criação sempre associa ao artista autenticado ──

// Feature: scheduling-system, Property 1: Ownership invariant — criação sempre associa ao artista autenticado
describe('Property 1: Ownership invariant — criação sempre associa ao artista autenticado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'createRule: artistId do recurso criado é sempre igual ao artistId do token JWT — nunca do body (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),       // artistId autenticado
          fc.uuid(),       // artistId no body (deve ser ignorado)
          fcValidRuleBody, // body válido
          async (authenticatedArtistId, bodyArtistId, ruleBody) => {
            fc.pre(authenticatedArtistId !== bodyArtistId)

            vi.resetAllMocks()

            const expectedCreated = {
              id:       crypto.randomUUID(),
              artistId: authenticatedArtistId,
              ...ruleBody,
            }

            vi.mocked(prisma.availabilityRule.create).mockResolvedValue(
              expectedCreated as unknown as Awaited<ReturnType<typeof prisma.availabilityRule.create>>,
            )

            const request = makeRequest({
              user: { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              // Body includes a different artistId — it must be ignored
              body: { ...ruleBody, artistId: bodyArtistId },
            }) as FastifyRequest & { user: AuthContext; body: Record<string, unknown> }

            const reply = makeReply()

            const created = await simulateCreateRuleHandler(request, reply)

            // Invariante: o recurso criado deve ter o artistId do token, não do body
            expect(reply.code).toHaveBeenCalledWith(201)

            // The create call must use the authenticated artistId
            expect(prisma.availabilityRule.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({ artistId: authenticatedArtistId }),
              }),
            )

            // The create call must NOT use the body artistId
            const createCall = vi.mocked(prisma.availabilityRule.create).mock.calls[0]
            const dataArg = (createCall[0] as { data: Record<string, unknown> }).data
            expect(dataArg.artistId).toBe(authenticatedArtistId)
            expect(dataArg.artistId).not.toBe(bodyArtistId)
          },
        ),
      )
    },
  )

  it(
    'createBlock: artistId do recurso criado é sempre igual ao artistId do token JWT — nunca do body (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),            // artistId autenticado
          fc.uuid(),            // artistId no body (deve ser ignorado)
          fcValidDatetimePair,  // [startAt, endAt] válidos
          async (authenticatedArtistId, bodyArtistId, [startAt, endAt]) => {
            fc.pre(authenticatedArtistId !== bodyArtistId)

            vi.resetAllMocks()

            const expectedCreated = {
              id:       crypto.randomUUID(),
              artistId: authenticatedArtistId,
              startAt:  new Date(startAt),
              endAt:    new Date(endAt),
            }

            vi.mocked(prisma.availabilityBlock.create).mockResolvedValue(
              expectedCreated as unknown as Awaited<ReturnType<typeof prisma.availabilityBlock.create>>,
            )

            const request = makeRequest({
              user: { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              // Body includes a different artistId — it must be ignored
              body: { startAt, endAt, artistId: bodyArtistId },
            }) as FastifyRequest & { user: AuthContext; body: Record<string, unknown> }

            const reply = makeReply()

            await simulateCreateBlockHandler(request, reply)

            // Invariante: o recurso criado deve ter o artistId do token, não do body
            expect(reply.code).toHaveBeenCalledWith(201)

            expect(prisma.availabilityBlock.create).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({ artistId: authenticatedArtistId }),
              }),
            )

            const createCall = vi.mocked(prisma.availabilityBlock.create).mock.calls[0]
            const dataArg = (createCall[0] as { data: Record<string, unknown> }).data
            expect(dataArg.artistId).toBe(authenticatedArtistId)
            expect(dataArg.artistId).not.toBe(bodyArtistId)
          },
        ),
      )
    },
  )
})

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

  // ── 2.2 updateRule — acesso cruzado retorna 403 ───────────────────────────

  it(
    'updateRule com artistId diferente do recurso retorna 403 — nunca 200 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // artistId autenticado (A)
          fc.uuid(), // artistId do recurso (B, diferente de A)
          fc.uuid(), // ruleId
          async (authenticatedArtistId, resourceArtistId, ruleId) => {
            fc.pre(authenticatedArtistId !== resourceArtistId)

            vi.resetAllMocks()

            vi.mocked(prisma.availabilityRule.findUnique).mockResolvedValue({
              id:       ruleId,
              artistId: resourceArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.availabilityRule.findUnique>>)

            const request = makeRequest({
              user:   { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              params: { id: ruleId },
              body:   {},
            }) as FastifyRequest & { user: AuthContext; params: { id: string }; body: Record<string, unknown> }

            const reply = makeReply()

            await simulateUpdateRuleHandler(request, reply)

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

  // ── 2.3 updateBlock — acesso cruzado retorna 403 ─────────────────────────

  it(
    'updateBlock com artistId diferente do recurso retorna 403 — nunca 200 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // artistId autenticado (A)
          fc.uuid(), // artistId do recurso (B, diferente de A)
          fc.uuid(), // blockId
          async (authenticatedArtistId, resourceArtistId, blockId) => {
            fc.pre(authenticatedArtistId !== resourceArtistId)

            vi.resetAllMocks()

            vi.mocked(prisma.availabilityBlock.findUnique).mockResolvedValue({
              id:       blockId,
              artistId: resourceArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.availabilityBlock.findUnique>>)

            const request = makeRequest({
              user:   { userId: authenticatedArtistId, artistId: authenticatedArtistId, role: 'artist' } as AuthContext,
              params: { id: blockId },
              body:   {},
            }) as FastifyRequest & { user: AuthContext; params: { id: string }; body: Record<string, unknown> }

            const reply = makeReply()

            await simulateUpdateBlockHandler(request, reply)

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

  // ── 2.4 Admin bypassa ownership ───────────────────────────────────────────

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

  // ── 2.5 Resposta de erro nunca expõe 200 ou 204 ───────────────────────────

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

// ─── Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt ──

// Feature: scheduling-system, Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt
describe('Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt', () => {
  // ── 3.1 CreateAvailabilityRuleSchema — startTime >= endTime é rejeitado ───

  it(
    'CreateAvailabilityRuleSchema rejeita qualquer body onde startTime >= endTime (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcInvalidTimePair,
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 1, max: 120 }),
          ([startTime, endTime], weekday, slotMinutes) => {
            const result = CreateAvailabilityRuleSchema.safeParse({
              weekday,
              startTime,
              endTime,
              slotMinutes,
              active: true,
            })

            // Invariante: deve ser inválido
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'CreateAvailabilityRuleSchema aceita qualquer body onde startTime < endTime (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidTimePair,
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 1, max: 120 }),
          ([startTime, endTime], weekday, slotMinutes) => {
            const result = CreateAvailabilityRuleSchema.safeParse({
              weekday,
              startTime,
              endTime,
              slotMinutes,
              active: true,
            })

            // Invariante: deve ser válido
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  // ── 3.2 UpdateAvailabilityRuleSchema — startTime >= endTime é rejeitado ───

  it(
    'UpdateAvailabilityRuleSchema rejeita qualquer body onde startTime >= endTime (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcInvalidTimePair,
          ([startTime, endTime]) => {
            const result = UpdateAvailabilityRuleSchema.safeParse({ startTime, endTime })

            // Invariante: deve ser inválido quando ambos os campos estão presentes e startTime >= endTime
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'UpdateAvailabilityRuleSchema aceita qualquer body onde startTime < endTime (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidTimePair,
          ([startTime, endTime]) => {
            const result = UpdateAvailabilityRuleSchema.safeParse({ startTime, endTime })

            // Invariante: deve ser válido
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  // ── 3.3 CreateAvailabilityBlockSchema — startAt >= endAt é rejeitado ──────

  it(
    'CreateAvailabilityBlockSchema rejeita qualquer body onde startAt >= endAt (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcInvalidDatetimePair,
          ([startAt, endAt]) => {
            const result = CreateAvailabilityBlockSchema.safeParse({ startAt, endAt })

            // Invariante: deve ser inválido
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'CreateAvailabilityBlockSchema aceita qualquer body onde startAt < endAt (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidDatetimePair,
          ([startAt, endAt]) => {
            const result = CreateAvailabilityBlockSchema.safeParse({ startAt, endAt })

            // Invariante: deve ser válido
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  // ── 3.4 UpdateAvailabilityBlockSchema — startAt >= endAt é rejeitado ──────

  it(
    'UpdateAvailabilityBlockSchema rejeita qualquer body onde startAt >= endAt (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcInvalidDatetimePair,
          ([startAt, endAt]) => {
            const result = UpdateAvailabilityBlockSchema.safeParse({ startAt, endAt })

            // Invariante: deve ser inválido quando ambos os campos estão presentes e startAt >= endAt
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'UpdateAvailabilityBlockSchema aceita qualquer body onde startAt < endAt (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcValidDatetimePair,
          ([startAt, endAt]) => {
            const result = UpdateAvailabilityBlockSchema.safeParse({ startAt, endAt })

            // Invariante: deve ser válido
            expect(result.success).toBe(true)
          },
        ),
      )
    },
  )

  // ── 3.5 Boundary: startTime === endTime é rejeitado ───────────────────────

  it(
    'CreateAvailabilityRuleSchema rejeita body onde startTime === endTime (boundary, mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcTime,
          fc.integer({ min: 0, max: 6 }),
          fc.integer({ min: 1, max: 120 }),
          (time, weekday, slotMinutes) => {
            const result = CreateAvailabilityRuleSchema.safeParse({
              weekday,
              startTime: time,
              endTime:   time, // igual a startTime
              slotMinutes,
              active: true,
            })

            // Invariante: startTime === endTime deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'CreateAvailabilityBlockSchema rejeita body onde startAt === endAt (boundary, mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcIsoDatetime,
          (datetime) => {
            const result = CreateAvailabilityBlockSchema.safeParse({
              startAt: datetime,
              endAt:   datetime, // igual a startAt
            })

            // Invariante: startAt === endAt deve ser rejeitado
            expect(result.success).toBe(false)
          },
        ),
      )
    },
  )
})
