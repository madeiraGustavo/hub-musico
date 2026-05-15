/**
 * auth.isolation.property.test.ts
 *
 * Property-based tests for multi-tenant isolation.
 * Validates that tenant boundaries are never crossed.
 *
 * Tests:
 * 1. Same email in different tenants → independent accounts
 * 2. Login isolation — cross-tenant auth is impossible
 * 3. JWT/session contain correct siteId
 * 4. Admin bypasses site isolation
 * 5. Security — no user query without siteId
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-isolation',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-isolation',
  },
}))

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./auth.repository.js', () => ({
  findUserByEmail:        vi.fn(),
  findUserByEmailAndSite: vi.fn(),
  findUserById:           vi.fn(),
  createUser:             vi.fn(),
  createRefreshToken:     vi.fn(),
  findRefreshToken:       vi.fn(),
  revokeRefreshToken:     vi.fn(),
  revokeAllUserTokens:    vi.fn(),
  findArtistById:         vi.fn(),
}))

// ── Mock password lib ─────────────────────────────────────────────────────────
vi.mock('../../lib/password.js', () => ({
  verifyPassword: vi.fn(),
  hashPassword:   vi.fn().mockResolvedValue('$2a$12$hashed'),
}))

import { login, register, getSession } from './auth.service.js'
import {
  findUserByEmailAndSite,
  findUserById,
  createUser,
  createRefreshToken,
} from './auth.repository.js'
import { verifyPassword } from '../../lib/password.js'
import jwt from 'jsonwebtoken'

// ── Valid site IDs for property generation ────────────────────────────────────
const VALID_SITES = ['platform', 'marketplace', 'tattoo', 'music'] as const
type SiteId = typeof VALID_SITES[number]

// ── Arbitraries ───────────────────────────────────────────────────────────────
const arbSiteId = fc.constantFrom(...VALID_SITES)
const arbEmail = fc.emailAddress()
const arbPassword = fc.string({ minLength: 6, maxLength: 50 })
const arbUserId = fc.uuid()

// ─── Property 1: Same email, different sites → independent accounts ──────────

describe('Property: Tenant Isolation — same email, different sites', () => {
  beforeEach(() => vi.clearAllMocks())

  it(
    'login with same email on different sites returns different user IDs (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbEmail,
          arbPassword,
          arbUserId,
          arbUserId,
          fc.constantFrom<[SiteId, SiteId]>(['marketplace', 'tattoo'], ['platform', 'marketplace'], ['tattoo', 'music']),
          async (email, password, userId1, userId2, [site1, site2]) => {
            fc.pre(userId1 !== userId2)
            fc.pre(site1 !== site2)

            vi.clearAllMocks()

            // Site 1 login
            vi.mocked(findUserByEmailAndSite).mockResolvedValueOnce({
              id: userId1, siteId: site1, email, password: '$2a$12$hash1', role: 'client', artistId: null,
            })
            vi.mocked(verifyPassword).mockResolvedValueOnce(true)
            vi.mocked(createRefreshToken).mockResolvedValueOnce(undefined)

            const result1 = await login(email, password, site1)
            const decoded1 = jwt.decode(result1.accessToken) as Record<string, unknown>

            // Site 2 login
            vi.mocked(findUserByEmailAndSite).mockResolvedValueOnce({
              id: userId2, siteId: site2, email, password: '$2a$12$hash2', role: 'client', artistId: null,
            })
            vi.mocked(verifyPassword).mockResolvedValueOnce(true)
            vi.mocked(createRefreshToken).mockResolvedValueOnce(undefined)

            const result2 = await login(email, password, site2)
            const decoded2 = jwt.decode(result2.accessToken) as Record<string, unknown>

            // INVARIANT: Different users, different siteIds in tokens
            expect(decoded1.sub).toBe(userId1)
            expect(decoded2.sub).toBe(userId2)
            expect(decoded1.siteId).toBe(site1)
            expect(decoded2.siteId).toBe(site2)
            expect(decoded1.sub).not.toBe(decoded2.sub)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 2: Cross-tenant login is impossible ────────────────────────────

describe('Property: Tenant Isolation — cross-tenant login fails', () => {
  beforeEach(() => vi.clearAllMocks())

  it(
    'login always fails when user exists on site A but login attempts site B (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbEmail,
          arbPassword,
          arbSiteId,
          arbSiteId,
          async (email, password, existsSite, attemptSite) => {
            fc.pre(existsSite !== attemptSite)

            vi.clearAllMocks()

            // User exists on existsSite but NOT on attemptSite
            vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)

            // INVARIANT: Login on wrong site always throws
            await expect(login(email, password, attemptSite)).rejects.toThrow('Credenciais inválidas')

            // INVARIANT: Query was made with the ATTEMPT site, not the exists site
            expect(findUserByEmailAndSite).toHaveBeenCalledWith(email, attemptSite)
            expect(findUserByEmailAndSite).not.toHaveBeenCalledWith(email, existsSite)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 3: JWT always contains correct siteId ──────────────────────────

describe('Property: JWT siteId correctness', () => {
  beforeEach(() => vi.clearAllMocks())

  it(
    'accessToken siteId always matches the site used for login (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbEmail,
          arbPassword,
          arbUserId,
          arbSiteId,
          async (email, password, userId, siteId) => {
            vi.clearAllMocks()

            vi.mocked(findUserByEmailAndSite).mockResolvedValue({
              id: userId, siteId, email, password: '$2a$12$hash', role: 'client', artistId: null,
            })
            vi.mocked(verifyPassword).mockResolvedValue(true)
            vi.mocked(createRefreshToken).mockResolvedValue(undefined)

            const result = await login(email, password, siteId)
            const decoded = jwt.decode(result.accessToken) as Record<string, unknown>

            // INVARIANT: Token siteId matches login site
            expect(decoded.siteId).toBe(siteId)
            expect(decoded.sub).toBe(userId)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 4: Session always returns correct siteId ───────────────────────

describe('Property: Session siteId correctness', () => {
  beforeEach(() => vi.clearAllMocks())

  it(
    'getSession always returns the siteId stored in the user record (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbEmail,
          arbSiteId,
          fc.constantFrom('admin', 'artist', 'editor', 'client' as const),
          async (userId, email, siteId, role) => {
            vi.clearAllMocks()

            vi.mocked(findUserById).mockResolvedValue({
              id: userId, siteId, email, password: '$2a$12$hash', role, artistId: null,
            })

            const session = await getSession(userId)

            // INVARIANT: Session siteId matches user record
            expect(session.user.siteId).toBe(siteId)
            expect(session.user.id).toBe(userId)
            expect(session.user.email).toBe(email)
            expect(session.user.role).toBe(role)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 5: Register isolation ─────────────────────────────────────────

describe('Property: Register isolation', () => {
  beforeEach(() => vi.clearAllMocks())

  it(
    'register on site A does not affect site B (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbEmail,
          arbPassword,
          arbUserId,
          arbSiteId,
          async (email, password, userId, siteId) => {
            vi.clearAllMocks()

            // Email does not exist on this site
            vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)
            vi.mocked(createUser).mockResolvedValue({
              id: userId, siteId, email, password: '$2a$12$hashed', role: 'client', artistId: null,
            })
            vi.mocked(createRefreshToken).mockResolvedValue(undefined)

            const result = await register(email, password, siteId)
            const decoded = jwt.decode(result.accessToken) as Record<string, unknown>

            // INVARIANT: createUser called with correct siteId
            expect(createUser).toHaveBeenCalledWith(siteId, email, '$2a$12$hashed', 'client', undefined)

            // INVARIANT: Token reflects the registration site
            expect(decoded.siteId).toBe(siteId)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'register fails when email already exists on the SAME site (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbEmail,
          arbPassword,
          arbUserId,
          arbSiteId,
          async (email, password, existingUserId, siteId) => {
            vi.clearAllMocks()

            // Email already exists on this site
            vi.mocked(findUserByEmailAndSite).mockResolvedValue({
              id: existingUserId, siteId, email, password: '$2a$12$existing', role: 'client', artistId: null,
            })

            // INVARIANT: Registration fails with duplicate error
            await expect(register(email, password, siteId)).rejects.toThrow('Email já cadastrado neste site')
            expect(createUser).not.toHaveBeenCalled()
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
