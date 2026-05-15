/**
 * authenticate.test.ts
 *
 * Unit tests for the authenticate hook and authenticateRoles factory.
 * Requirements: 3.7, 3.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate, authenticateRoles } from './authenticate.js'

// Mock Prisma so no real DB connection is needed
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock sites module
vi.mock('../lib/sites.js', () => ({
  resolveSiteFromRequest: vi.fn().mockReturnValue({ id: 'platform', slug: 'platform', cookieName: 'ah_platform_refresh' }),
}))

// Import the mocked prisma after vi.mock is hoisted
import { prisma } from '../lib/prisma.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(overrides: Partial<FastifyRequest> = {}): FastifyRequest {
  return {
    jwtVerify: vi.fn(),
    user: undefined,
    headers: { 'x-site-id': 'platform' },
    ...overrides,
  } as unknown as FastifyRequest
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('authenticate hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Missing token ────────────────────────────────────────────────────

  it('returns 401 when no Authorization header / token is missing', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockRejectedValue(new Error('No Authorization was found in request.headers')),
    })
    const reply = makeReply()

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect((reply.code(401) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Não autorizado',
    })
  })

  // ── 2. Malformed token ──────────────────────────────────────────────────

  it('returns 401 when Authorization header is malformed (not a valid Bearer token)', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockRejectedValue(new Error('Authorization header is malformed')),
    })
    const reply = makeReply()

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect((reply.code(401) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Não autorizado',
    })
  })

  // ── 3. Expired token ────────────────────────────────────────────────────

  it('returns 401 when JWT is expired', async () => {
    const expiredError = new Error('jwt expired')
    expiredError.name = 'TokenExpiredError'

    const request = makeRequest({
      jwtVerify: vi.fn().mockRejectedValue(expiredError),
    })
    const reply = makeReply()

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect((reply.code(401) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Não autorizado',
    })
  })

  // ── 4. Invalid signature ────────────────────────────────────────────────

  it('returns 401 when JWT signature is invalid', async () => {
    const sigError = new Error('invalid signature')
    sigError.name = 'JsonWebTokenError'

    const request = makeRequest({
      jwtVerify: vi.fn().mockRejectedValue(sigError),
    })
    const reply = makeReply()

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect((reply.code(401) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Não autorizado',
    })
  })

  // ── 5. Valid token but artist_id is null ────────────────────────────────

  it('returns 403 when token is valid but user has no artist profile (artistId is null)', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-123', role: 'artist' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'artist',
      siteId: 'platform',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Perfil de artista não configurado',
    })
  })

  // ── 6. Valid token with artist_id ───────────────────────────────────────

  it('injects AuthContext into request.user when token is valid and artist profile exists', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-456', role: 'artist' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'artist',
      siteId: 'platform',
      artistId: 'artist-789',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId:   'user-456',
      artistId: 'artist-789',
      role:     'artist',
      siteId:   'platform',
    })
  })
})

// ─── authenticateRoles factory ────────────────────────────────────────────────

describe('authenticateRoles factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 403 when user role is not in the allowed list', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-editor', role: 'editor' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'editor',
      siteId: 'platform',
      artistId: 'artist-001',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const handler = authenticateRoles(['admin', 'artist'])
    await handler(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Permissão insuficiente',
    })
  })

  it('allows admin role even when artistId is null', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'admin-001', role: 'admin' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'admin',
      siteId: 'platform',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const handler = authenticateRoles(['admin'])
    await handler(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId:   'admin-001',
      artistId: '',
      role:     'admin',
      siteId:   'platform',
    })
  })
})

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Property 3: artist_id nunca vem do token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'artist_id em request.user sempre vem do banco, ignorando qualquer artistId no body/query (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, dbArtistId, bodyArtistId) => {
            fc.pre(dbArtistId !== bodyArtistId)

            const request = makeRequest({
              jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
                ;(this as unknown as Record<string, unknown>).user = {
                  sub:  userId,
                  role: 'artist',
                  artist_id: bodyArtistId,
                  artistId:  bodyArtistId,
                }
              }),
              body:  { artistId: bodyArtistId, artist_id: bodyArtistId },
              query: { artistId: bodyArtistId, artist_id: bodyArtistId },
            })
            const reply = makeReply()

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              role:     'artist',
              siteId:   'platform',
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            expect(reply.code).not.toHaveBeenCalled()

            const ctx = request.user as { userId: string; artistId: string; role: string; siteId: string }
            expect(ctx.artistId).toBe(dbArtistId)
            expect(ctx.artistId).not.toBe(bodyArtistId)
            expect(ctx.userId).toBe(userId)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'artist_id do banco é usado mesmo quando o token payload contém um artist_id diferente (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, dbArtistId, tokenArtistId) => {
            fc.pre(dbArtistId !== tokenArtistId)

            const request = makeRequest({
              jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
                ;(this as unknown as Record<string, unknown>).user = {
                  sub:       userId,
                  role:      'artist',
                  artistId:  tokenArtistId,
                  artist_id: tokenArtistId,
                }
              }),
            })
            const reply = makeReply()

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              role:     'artist',
              siteId:   'platform',
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            expect(reply.code).not.toHaveBeenCalled()

            const ctx = request.user as { userId: string; artistId: string; role: string; siteId: string }
            expect(ctx.artistId).toBe(dbArtistId)
            expect(ctx.artistId).not.toBe(tokenArtistId)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'Prisma é consultado com o userId do token sub — nunca com um userId do body (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (tokenUserId, bodyUserId, dbArtistId) => {
            fc.pre(tokenUserId !== bodyUserId)

            const request = makeRequest({
              jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
                ;(this as unknown as Record<string, unknown>).user = {
                  sub:  tokenUserId,
                  role: 'artist',
                }
              }),
              body: { userId: bodyUserId, user_id: bodyUserId },
            })
            const reply = makeReply()

            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              role:     'artist',
              siteId:   'platform',
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            expect(reply.code).not.toHaveBeenCalled()

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
              where:  { id: tokenUserId },
              select: { role: true, siteId: true, artistId: true },
            })
            expect(prisma.user.findUnique).not.toHaveBeenCalledWith(
              expect.objectContaining({ where: { id: bodyUserId } }),
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

describe('Property 5: Token expirado é rejeitado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'retorna 401 para qualquer timestamp exp no passado (mínimo 100 iterações)',
    async () => {
      const nowInSeconds = Math.floor(Date.now() / 1000)

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: nowInSeconds - 1 }),
          async (pastExp) => {
            const expiredError = new Error(`jwt expired at ${new Date(pastExp * 1000).toISOString()}`)
            expiredError.name = 'TokenExpiredError'

            const request = makeRequest({
              jwtVerify: vi.fn().mockRejectedValue(expiredError),
            })
            const reply = makeReply()

            await authenticate(request, reply)

            expect(reply.code).toHaveBeenCalledWith(401)
            expect(
              (reply.code(401) as unknown as { send: ReturnType<typeof vi.fn> }).send,
            ).toHaveBeenCalledWith({ error: 'Não autorizado' })
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
