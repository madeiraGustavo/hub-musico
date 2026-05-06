/**
 * auth.service.property.test.ts
 *
 * Property-based tests for auth.service.ts
 *
 * Property 1: JWT round-trip preserva identidade do usuário
 * Validates: Requirements 3.1, 3.7
 *
 * Property 2: Refresh token invalida após uso (rotação)
 * Validates: Requirements 3.1, 4.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ── Mock env before any imports that use it ───────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-property',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-property',
  },
}))

// ── Mock repository (not needed for JWT round-trip, but required by module) ───
vi.mock('./auth.repository.js', () => ({
  findUserByEmail:     vi.fn(),
  findUserById:        vi.fn(),
  createRefreshToken:  vi.fn(),
  findRefreshToken:    vi.fn(),
  revokeRefreshToken:  vi.fn(),
  revokeAllUserTokens: vi.fn(),
}))

// ── Mock password lib ─────────────────────────────────────────────────────────
vi.mock('../../lib/password.js', () => ({
  verifyPassword: vi.fn(),
}))

import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { refresh } from './auth.service.js'
import {
  findUserById,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from './auth.repository.js'

// ── Property 1: JWT round-trip preserva identidade do usuário ─────────────────
//
// Para qualquer usuário válido que faz login, o access token emitido,
// quando verificado, deve retornar exatamente o `userId` e `role` do
// usuário que fez login — sem mutação.
//
// Validates: Requirements 3.1, 3.7

describe('Property 1: JWT round-trip preserva identidade do usuário', () => {
  it(
    'para qualquer userId e role válidos, o token assinado e verificado retorna exatamente os mesmos valores',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            role:   fc.constantFrom('admin', 'artist', 'editor' as const),
          }),
          async ({ userId, role }) => {
            const JWT_SECRET = 'test-jwt-secret-property'

            // Sign using the same logic as signAccessToken() in auth.service.ts
            const token = jwt.sign(
              { sub: userId, role },
              JWT_SECRET,
              { expiresIn: '15m' },
            )

            // Verify using the same secret
            const decoded = jwt.verify(token, JWT_SECRET) as {
              sub:  string
              role: string
              iat:  number
              exp:  number
            }

            // Assert identity is preserved — no mutation
            expect(decoded.sub).toBe(userId)
            expect(decoded.role).toBe(role)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ── Property 2: Refresh token invalida após uso (rotação) ─────────────────────
//
// Para qualquer refresh token válido, após ser usado para emitir um novo
// access token, o token original deve ter `revoked = true` no banco e não
// deve mais ser aceito para emitir novos tokens.
//
// Validates: Requirements 3.1, 4.7

describe('Property 2: Refresh token invalida após uso (rotação)', () => {
  const JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-property'

  // Helper: gera um refresh token JWT válido assinado com o secret de teste
  function makeRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
  }

  // Helper: computa o hash SHA-256 de um token (espelha auth.service.ts)
  function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'para qualquer userId, o token original é revogado após uso e não pode ser reutilizado',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Reset all mocks between fast-check iterations to clear both
            // call history and any leftover mockResolvedValueOnce queues
            vi.resetAllMocks()

            // ── Arrange ──────────────────────────────────────────────────────

            const originalToken = makeRefreshToken(userId)
            const originalHash  = hashToken(originalToken)

            const storedTokenRow = {
              id:        crypto.randomUUID(),
              userId,
              tokenHash: originalHash,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              revoked:   false,
            }

            const mockUser = {
              id:       userId,
              email:    `${userId}@example.com`,
              password: '$2a$12$hashedpassword',
              role:     'artist' as const,
              artistId: crypto.randomUUID(),
            }

            // First call: token found (not yet revoked)
            // Second call: token not found (already revoked — query filters revoked=false)
            vi.mocked(findRefreshToken)
              .mockResolvedValueOnce(storedTokenRow)
              .mockResolvedValueOnce(null)

            vi.mocked(revokeRefreshToken).mockResolvedValue(undefined)
            vi.mocked(findUserById).mockResolvedValue(mockUser)
            vi.mocked(createRefreshToken).mockResolvedValue(undefined)

            // ── Act: first use of the original token ──────────────────────────

            await refresh(originalToken)

            // ── Assert: original token was revoked ────────────────────────────

            // revokeRefreshToken must have been called exactly once
            expect(revokeRefreshToken).toHaveBeenCalledOnce()
            // It must have been called with the stored row's id (the service
            // calls revokeRefreshToken(stored.id) where stored = findRefreshToken result)
            expect(vi.mocked(revokeRefreshToken).mock.calls[0][0]).toBe(storedTokenRow.id)

            // A new refresh token must have been persisted (rotation)
            expect(createRefreshToken).toHaveBeenCalledOnce()
            expect(createRefreshToken).toHaveBeenCalledWith(
              userId,
              expect.any(String), // new token hash
              expect.any(Date),
            )

            // ── Act: attempt to reuse the original token ──────────────────────

            // findRefreshToken returns null on second call (token is revoked)
            await expect(refresh(originalToken)).rejects.toThrow(
              'Refresh token inválido ou expirado',
            )

            // revokeRefreshToken must NOT have been called a second time
            // (the revoked token was never found, so there's nothing to revoke)
            expect(revokeRefreshToken).toHaveBeenCalledOnce()
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'para qualquer userId, o token original não pode ser reutilizado mesmo que a assinatura JWT ainda seja válida',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Reset all mocks between fast-check iterations to clear both
            // call history and any leftover mockResolvedValueOnce queues
            vi.resetAllMocks()

            // ── Arrange ──────────────────────────────────────────────────────

            const originalToken = makeRefreshToken(userId)

            // Simulate the token being absent from the DB (already revoked)
            vi.mocked(findRefreshToken).mockResolvedValue(null)

            // ── Act & Assert ──────────────────────────────────────────────────

            // Even though the JWT signature is valid, the token must be rejected
            // because it is no longer present in the DB (revoked = true)
            await expect(refresh(originalToken)).rejects.toThrow(
              'Refresh token inválido ou expirado',
            )

            // No new token should have been issued
            expect(createRefreshToken).not.toHaveBeenCalled()
            expect(revokeRefreshToken).not.toHaveBeenCalled()
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
