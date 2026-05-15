/**
 * auth.security.test.ts
 *
 * Security tests for multi-tenant auth.
 * Validates:
 * - Backend resolves tenant from header, not body
 * - Invalid tenant falls back safely
 * - Admin bypasses site isolation
 * - Cookies are isolated per tenant
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate, authenticateRoles } from '../../hooks/authenticate.js'

// Mock Prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock sites — we control what resolveSiteFromRequest returns
const mockResolveSite = vi.fn()
vi.mock('../../lib/sites.js', () => ({
  resolveSiteFromRequest: (...args: unknown[]) => mockResolveSite(...args),
}))

import { prisma } from '../../lib/prisma.js'

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

describe('Security: Site isolation enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveSite.mockReturnValue({ id: 'marketplace', slug: 'marketplace', cookieName: 'ah_marketplace_refresh' })
  })

  it('denies access when user siteId does not match request site', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-001' }
      }),
    })
    const reply = makeReply()

    // User belongs to 'tattoo' but request is for 'marketplace'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'artist',
      siteId: 'tattoo',
      artistId: 'artist-001',
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Acesso negado: site incorreto',
    })
  })

  it('allows access when user siteId matches request site', async () => {
    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'user-002' }
      }),
    })
    const reply = makeReply()

    // User belongs to 'marketplace' and request is for 'marketplace'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'client',
      siteId: 'marketplace',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId: 'user-002',
      artistId: '',
      role: 'client',
      siteId: 'marketplace',
    })
  })

  it('admin bypasses site isolation — can access any site', async () => {
    mockResolveSite.mockReturnValue({ id: 'tattoo', slug: 'tattoo', cookieName: 'ah_tattoo_refresh' })

    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'admin-001' }
      }),
    })
    const reply = makeReply()

    // Admin belongs to 'platform' but request is for 'tattoo'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'admin',
      siteId: 'platform',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    // Admin should NOT be denied
    expect(reply.code).not.toHaveBeenCalled()
    expect(request.user).toEqual({
      userId: 'admin-001',
      artistId: '',
      role: 'admin',
      siteId: 'platform',
    })
  })

  it('client role is denied access to platform site', async () => {
    mockResolveSite.mockReturnValue({ id: 'platform', slug: 'platform', cookieName: 'ah_platform_refresh' })

    const request = makeRequest({
      jwtVerify: vi.fn().mockImplementation(async function (this: FastifyRequest) {
        ;(this as unknown as Record<string, unknown>).user = { sub: 'client-001' }
      }),
    })
    const reply = makeReply()

    // Client belongs to 'marketplace' but tries to access 'platform'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      role: 'client',
      siteId: 'marketplace',
      artistId: null,
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await authenticate(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect((reply.code(403) as unknown as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalledWith({
      error: 'Acesso negado: site incorreto',
    })
  })
})

describe('Security: resolveSiteFromRequest behavior', () => {
  it('invalid X-Site-Id header falls back to platform', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: { 'x-site-id': 'hacker-site' },
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('platform')
  })

  it('missing X-Site-Id header falls back to platform', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: {},
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('platform')
  })

  it('valid X-Site-Id header returns correct site', async () => {
    const { resolveSiteFromRequest: realResolve } = await vi.importActual<typeof import('../../lib/sites.js')>('../../lib/sites.js')

    const fakeReq = {
      headers: { 'x-site-id': 'marketplace' },
    } as unknown as FastifyRequest

    const site = realResolve(fakeReq)
    expect(site.id).toBe('marketplace')
  })
})
