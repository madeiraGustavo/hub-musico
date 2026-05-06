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
    headers: {},
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
        // Simulate @fastify/jwt setting request.user after verification
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-123', role: 'artist' }
      }),
    })
    const reply = makeReply()

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'artist',
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
      artistId: 'artist-789',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId:   'user-456',
      artistId: 'artist-789',
      role:     'artist',
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
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const handler = authenticateRoles(['admin'])
    await handler(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId:   'admin-001',
      artistId: '',
      role:     'admin',
    })
  })
})

// ─── Property Tests ───────────────────────────────────────────────────────────

/**
 * Property 3: `artist_id` nunca vem do token
 *
 * Para qualquer request autenticado, o `artist_id` injetado em `request.user`
 * deve ser igual ao valor retornado pela query no banco — nunca igual a um
 * valor arbitrário passado no body ou query string.
 *
 * Validates: Requirements 3.5
 */
describe('Property 3: artist_id nunca vem do token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'artist_id em request.user sempre vem do banco, ignorando qualquer artistId no body/query (mínimo 100 iterações)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),  // userId legítimo no token
          fc.uuid(),  // artistId real retornado pelo banco
          fc.uuid(),  // artistId arbitrário passado no body/query (deve ser ignorado)
          async (userId, dbArtistId, bodyArtistId) => {
            // Pré-condição: o artistId do body é diferente do que está no banco,
            // para que o teste seja significativo
            fc.pre(dbArtistId !== bodyArtistId)

            // Simula token verificado com sucesso — o payload do token NÃO contém artist_id
            const request = makeRequest({
              jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
                ;(this as unknown as Record<string, unknown>).user = {
                  sub:  userId,
                  role: 'artist',
                  // Mesmo que um atacante injete artist_id no payload do token,
                  // o hook deve ignorá-lo e usar o valor do banco
                  artist_id: bodyArtistId,
                  artistId:  bodyArtistId,
                }
              }),
              // Simula body e query string com artistId arbitrário
              body:  { artistId: bodyArtistId, artist_id: bodyArtistId },
              query: { artistId: bodyArtistId, artist_id: bodyArtistId },
            })
            const reply = makeReply()

            // O banco retorna o artistId real — diferente do que está no body/token
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              role:     'artist',
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            // O hook não deve ter retornado erro
            expect(reply.code).not.toHaveBeenCalled()

            // O artistId injetado deve ser exatamente o do banco
            const ctx = request.user as { userId: string; artistId: string; role: string }
            expect(ctx.artistId).toBe(dbArtistId)

            // E nunca deve ser o valor arbitrário do body/query/token
            expect(ctx.artistId).not.toBe(bodyArtistId)

            // O userId também deve vir do sub do token (não de outro campo)
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
          fc.uuid(),  // userId
          fc.uuid(),  // artistId real no banco
          fc.uuid(),  // artistId forjado no payload do token
          async (userId, dbArtistId, tokenArtistId) => {
            fc.pre(dbArtistId !== tokenArtistId)

            const request = makeRequest({
              jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
                // Token contém um artist_id forjado — deve ser completamente ignorado
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
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            expect(reply.code).not.toHaveBeenCalled()

            const ctx = request.user as { userId: string; artistId: string; role: string }

            // Invariante central: artistId vem do banco, nunca do token
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
          fc.uuid(),  // userId legítimo (sub do token)
          fc.uuid(),  // userId arbitrário no body (deve ser ignorado)
          fc.uuid(),  // artistId retornado pelo banco
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
              artistId: dbArtistId,
            } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

            await authenticate(request, reply)

            expect(reply.code).not.toHaveBeenCalled()

            // Verifica que o Prisma foi chamado com o userId do token (sub),
            // não com o userId do body
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
              where:  { id: tokenUserId },
              select: { role: true, artistId: true },
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

/**
 * Property 5: Token expirado é rejeitado
 *
 * Para qualquer access token com `exp` no passado, qualquer endpoint protegido
 * deve retornar HTTP 401 com `{ "error": "Não autorizado" }`.
 *
 * Validates: Requirements 3.7
 */
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
          // Gera timestamps no passado: de 1 segundo atrás até ~68 anos atrás
          fc.integer({ min: 1, max: nowInSeconds - 1 }),
          async (pastExp) => {
            // Simula o que @fastify/jwt faz ao verificar um token com exp expirado:
            // lança um erro com name 'TokenExpiredError'
            const expiredError = new Error(`jwt expired at ${new Date(pastExp * 1000).toISOString()}`)
            expiredError.name = 'TokenExpiredError'

            const request = makeRequest({
              jwtVerify: vi.fn().mockRejectedValue(expiredError),
            })
            const reply = makeReply()

            await authenticate(request, reply)

            // O hook deve retornar 401 com a mensagem padrão
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
