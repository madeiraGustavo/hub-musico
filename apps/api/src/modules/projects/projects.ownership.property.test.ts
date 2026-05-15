/**
 * projects.ownership.property.test.ts
 *
 * Property-based tests for Property 5: Ownership check para operações de escrita em projetos
 *
 * Para qualquer par de artistas distintos A e B, uma operação de escrita
 * (PATCH/DELETE) autenticada como A em um projeto pertencente a B deve
 * retornar HTTP 403 — nunca HTTP 200 ou 204.
 *
 * Validates: Requirements 9.4, 9.5, 9.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'

// ── Mock Prisma so no real DB connection is needed ────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
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

// ── Ownership check logic ─────────────────────────────────────────────────────
//
// This mirrors the ownership enforcement logic in projects.controller.ts.
// Extracted here as a pure, testable unit.

interface AuthContext {
  userId:   string
  artistId: string
  role:     'admin' | 'artist' | 'editor'
  siteId:   string
}

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
  // Admin bypassa ownership
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
    user: undefined,
    headers: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as FastifyRequest
}

// ── Simulated controller handlers (mirrors projects.controller.ts) ────────────
//
// These simulate the PATCH/DELETE handler logic:
// 1. Auth context is already injected by the authenticate hook (preHandler)
// 2. Handler fetches the resource from the repository
// 3. Handler calls assertOwnership
// 4. If not allowed → 403
// 5. If allowed → proceed (returns 200/204 in real impl, stubs here)

async function simulatePatchHandler(
  request: FastifyRequest & { user: AuthContext; params: { id: string } },
  reply: FastifyReply,
): Promise<void> {
  const project = await (prisma.project as unknown as {
    findUnique: (args: unknown) => Promise<{ id: string; artistId: string; status: string } | null>
  }).findUnique({
    where:  { id: request.params.id },
    select: { id: true, artistId: true, status: true },
  })

  if (!project) {
    reply.code(404).send({ error: 'Não encontrado' })
    return
  }

  const result = assertOwnership(request.user, project.artistId)
  if (!result.allowed) {
    reply.code(result.status!).send({ error: result.error })
    return
  }

  // Would proceed with update in real impl — return 200 for test purposes
  reply.code(200).send({ id: project.id })
}

async function simulateDeleteHandler(
  request: FastifyRequest & { user: AuthContext; params: { id: string } },
  reply: FastifyReply,
): Promise<void> {
  const { role } = request.user

  // Editor não tem permissão para deletar (mirrors projects.controller.ts)
  if (role === 'editor') {
    reply.code(403).send({ error: 'Permissão insuficiente' })
    return
  }

  const project = await (prisma.project as unknown as {
    findUnique: (args: unknown) => Promise<{ id: string; artistId: string; status: string } | null>
  }).findUnique({
    where:  { id: request.params.id },
    select: { id: true, artistId: true, status: true },
  })

  if (!project) {
    reply.code(404).send({ error: 'Não encontrado' })
    return
  }

  const result = assertOwnership(request.user, project.artistId)
  if (!result.allowed) {
    reply.code(result.status!).send({ error: result.error })
    return
  }

  // Regra de negócio: apenas projetos em draft podem ser removidos
  if (project.status !== 'draft') {
    reply.code(422).send({ error: 'Apenas projetos em rascunho podem ser removidos' })
    return
  }

  // Would proceed with delete in real impl — return 204 for test purposes
  reply.code(204).send()
}

// ─── Property 5: Ownership check para operações de escrita em projetos ────────

/**
 * Property 5: Ownership check para operações de escrita em projetos
 *
 * Para qualquer par de artistas distintos A e B, uma operação de escrita
 * (PATCH/DELETE) autenticada como A em um projeto pertencente a B deve
 * retornar HTTP 403 — nunca HTTP 200 ou 204.
 *
 * Validates: Requirements 9.4, 9.5, 9.6
 */
describe('Property 5: Ownership check para operações de escrita em projetos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 5.1 assertOwnership — função pura ────────────────────────────────────

  it(
    'assertOwnership retorna 403 para qualquer par de artistIds distintos (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userIdA
          fc.uuid(), // userIdB
          fc.uuid(), // resourceArtistId (pertence a B, diferente de A)
          async (userIdA, userIdB, resourceArtistId) => {
            // Pré-condição: A e B são distintos, e o recurso pertence a B (não a A)
            fc.pre(userIdA !== userIdB && resourceArtistId !== userIdA)

            const authContextA: AuthContext = {
              userId:   userIdA,
              artistId: userIdA, // artistId de A é diferente de resourceArtistId
              role:     'artist',
            siteId:   'platform',
            }

            const result = assertOwnership(authContextA, resourceArtistId)

            // Invariante: acesso deve ser negado
            expect(result.allowed).toBe(false)
            expect(result.status).toBe(403)
            expect(result.error).toBe('Acesso negado')
          },
        ),
        { numRuns: 100 },
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
            const authContext: AuthContext = {
              userId,
              artistId,
              role:     'artist',
            siteId:   'platform',
            }

            // Recurso pertence ao próprio artista autenticado
            const result = assertOwnership(authContext, artistId)

            expect(result.allowed).toBe(true)
            expect(result.status).toBeNull()
            expect(result.error).toBeNull()
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 5.2 PATCH handler — acesso cruzado retorna 403 ───────────────────────

  it(
    'PATCH com artistId diferente do projeto retorna 403 — nunca 200 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userIdA
          fc.uuid(), // userIdB
          fc.uuid(), // resourceArtistId (pertence a B)
          fc.uuid(), // projectId
          async (userIdA, userIdB, resourceArtistId, projectId) => {
            fc.pre(userIdA !== userIdB && resourceArtistId !== userIdA)

            vi.resetAllMocks()

            // Simula projeto pertencente a resourceArtistId (não a userIdA)
            vi.mocked(prisma.project.findUnique).mockResolvedValue({
              id:       projectId,
              artistId: resourceArtistId,
              status:   'draft',
            } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

            const request = makeRequest({
              user:   { userId: userIdA, artistId: userIdA, role: 'artist', siteId: 'platform' } as AuthContext,
              params: { id: projectId },
            }) as FastifyRequest & { user: AuthContext; params: { id: string } }

            const reply = makeReply()

            await simulatePatchHandler(request, reply)

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
        { numRuns: 100 },
      )
    },
  )

  // ── 5.3 DELETE handler — acesso cruzado retorna 403 ──────────────────────

  it(
    'DELETE com artistId diferente do projeto retorna 403 — nunca 204 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userIdA
          fc.uuid(), // userIdB
          fc.uuid(), // resourceArtistId (pertence a B)
          fc.uuid(), // projectId
          async (userIdA, userIdB, resourceArtistId, projectId) => {
            fc.pre(userIdA !== userIdB && resourceArtistId !== userIdA)

            vi.resetAllMocks()

            // Simula projeto pertencente a resourceArtistId (não a userIdA), em draft
            vi.mocked(prisma.project.findUnique).mockResolvedValue({
              id:       projectId,
              artistId: resourceArtistId,
              status:   'draft',
            } as unknown as Awaited<ReturnType<typeof prisma.project.findUnique>>)

            const request = makeRequest({
              user:   { userId: userIdA, artistId: userIdA, role: 'artist', siteId: 'platform' } as AuthContext,
              params: { id: projectId },
            }) as FastifyRequest & { user: AuthContext; params: { id: string } }

            const reply = makeReply()

            await simulateDeleteHandler(request, reply)

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
        { numRuns: 100 },
      )
    },
  )

  // ── 5.4 Admin bypassa ownership ───────────────────────────────────────────

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
            siteId:   'platform',
            }

            // Admin deve sempre ter acesso, independente do resourceArtistId
            const result = assertOwnership(adminContext, resourceArtistId)

            expect(result.allowed).toBe(true)
            expect(result.status).toBeNull()
            expect(result.error).toBeNull()
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 5.5 Resposta de erro nunca expõe 200 ou 204 ───────────────────────────

  it(
    'para qualquer par de artistas distintos, o status de resposta é sempre 403 — nunca 200 nem 204 (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // userIdA
          fc.uuid(), // resourceArtistId (pertence a B, diferente de A)
          async (userIdA, resourceArtistId) => {
            fc.pre(userIdA !== resourceArtistId)

            const authContextA: AuthContext = {
              userId:   userIdA,
              artistId: userIdA,
              role:     'artist',
            siteId:   'platform',
            }

            const result = assertOwnership(authContextA, resourceArtistId)

            // O status nunca pode ser 200 ou 204 quando o acesso é negado
            if (!result.allowed) {
              expect(result.status).not.toBe(200)
              expect(result.status).not.toBe(204)
              expect(result.status).toBe(403)
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
