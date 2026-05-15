/**
 * auth.service.test.ts
 *
 * Unit tests for auth.service.ts
 * Requirements: 3.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock env before any imports that use it ───────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
  },
}))

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./auth.repository.js', () => ({
  findUserByEmail:        vi.fn(),
  findUserByEmailAndSite: vi.fn(),
  findUserById:           vi.fn(),
  createRefreshToken:     vi.fn(),
  createUser:             vi.fn(),
  findRefreshToken:       vi.fn(),
  revokeRefreshToken:     vi.fn(),
  revokeAllUserTokens:    vi.fn(),
}))

// ── Mock password lib ─────────────────────────────────────────────────────────
vi.mock('../../lib/password.js', () => ({
  verifyPassword: vi.fn(),
  hashPassword:   vi.fn(),
}))

import { login, refresh } from './auth.service.js'
import {
  findUserByEmail,
  findUserByEmailAndSite,
  findUserById,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from './auth.repository.js'
import { verifyPassword } from '../../lib/password.js'
import jwt from 'jsonwebtoken'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_USER = {
  id:       'user-uuid-001',
  siteId:   'platform',
  email:    'artist@example.com',
  password: '$2a$12$hashedpassword',
  role:     'artist' as const,
  artistId: 'artist-uuid-001',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('auth.service — login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. Login com credenciais corretas ─────────────────────────────────────

  it('retorna accessToken e refreshToken quando as credenciais são válidas', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(MOCK_USER)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await login('artist@example.com', 'correct-password')

    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')
    expect(typeof result.accessToken).toBe('string')
    expect(typeof result.refreshToken).toBe('string')

    // Access token deve conter o userId e role corretos
    const decoded = jwt.decode(result.accessToken) as Record<string, unknown>
    expect(decoded.sub).toBe(MOCK_USER.id)
    expect(decoded.role).toBe(MOCK_USER.role)

    // Refresh token deve conter o userId correto
    const decodedRefresh = jwt.decode(result.refreshToken) as Record<string, unknown>
    expect(decodedRefresh.sub).toBe(MOCK_USER.id)

    // Deve ter persistido o hash do refresh token no banco
    expect(createRefreshToken).toHaveBeenCalledOnce()
    expect(createRefreshToken).toHaveBeenCalledWith(
      MOCK_USER.id,
      expect.any(String), // hash SHA-256
      expect.any(Date),
    )
  })

  // ── 2. Login com senha errada ─────────────────────────────────────────────

  it('lança erro quando a senha está errada', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(MOCK_USER)
    vi.mocked(verifyPassword).mockResolvedValue(false)

    await expect(login('artist@example.com', 'wrong-password')).rejects.toThrow('Credenciais inválidas')

    expect(createRefreshToken).not.toHaveBeenCalled()
  })

  // ── 3. Login com email inexistente ────────────────────────────────────────

  it('lança erro quando o email não existe no banco', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)

    await expect(login('nonexistent@example.com', 'any-password')).rejects.toThrow('Credenciais inválidas')

    expect(verifyPassword).not.toHaveBeenCalled()
    expect(createRefreshToken).not.toHaveBeenCalled()
  })

  // ── 4. Login com usuário sem senha (Supabase legacy) ──────────────────────

  it('lança erro quando o usuário existe mas não tem senha cadastrada (password = null)', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue({ ...MOCK_USER, password: null })

    await expect(login('artist@example.com', 'any-password')).rejects.toThrow('Credenciais inválidas')

    expect(verifyPassword).not.toHaveBeenCalled()
    expect(createRefreshToken).not.toHaveBeenCalled()
  })
})

describe('auth.service — refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper: gera um refresh token JWT válido assinado com o secret de teste
  function makeRefreshToken(userId: string, expiresIn = '7d'): string {
    return jwt.sign({ sub: userId }, 'test-jwt-refresh-secret', { expiresIn })
  }

  // ── 5. Refresh com token revogado ─────────────────────────────────────────

  it('lança erro quando o refresh token foi revogado (não encontrado no banco)', async () => {
    const token = makeRefreshToken(MOCK_USER.id)

    // findRefreshToken retorna null quando o token está revogado
    // (a query filtra por revoked = false)
    vi.mocked(findRefreshToken).mockResolvedValue(null)

    await expect(refresh(token)).rejects.toThrow('Refresh token inválido ou expirado')

    expect(revokeRefreshToken).not.toHaveBeenCalled()
  })

  // ── 6. Refresh com token expirado (JWT expirado) ──────────────────────────

  it('lança erro quando o refresh token JWT está expirado', async () => {
    // jwt.sign com expiresIn: -1 gera um token com exp no passado imediato
    const expiredToken = jwt.sign(
      { sub: MOCK_USER.id },
      'test-jwt-refresh-secret',
      { expiresIn: -1 },
    )

    await expect(refresh(expiredToken)).rejects.toThrow('Refresh token inválido')

    expect(findRefreshToken).not.toHaveBeenCalled()
    expect(revokeRefreshToken).not.toHaveBeenCalled()
  })

  // ── 7. Refresh com token de assinatura inválida ───────────────────────────

  it('lança erro quando o refresh token tem assinatura inválida', async () => {
    const tokenWithWrongSecret = jwt.sign(
      { sub: MOCK_USER.id },
      'wrong-secret',
      { expiresIn: '7d' },
    )

    await expect(refresh(tokenWithWrongSecret)).rejects.toThrow('Refresh token inválido')

    expect(findRefreshToken).not.toHaveBeenCalled()
    expect(revokeRefreshToken).not.toHaveBeenCalled()
  })

  // ── 8. Refresh com token válido → rotação ─────────────────────────────────

  it('retorna novo par de tokens e revoga o token anterior quando o refresh é válido', async () => {
    const token = makeRefreshToken(MOCK_USER.id)

    const storedToken = {
      id:        'refresh-token-row-001',
      userId:    MOCK_USER.id,
      tokenHash: 'some-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked:   false,
    }

    vi.mocked(findRefreshToken).mockResolvedValue(storedToken)
    vi.mocked(revokeRefreshToken).mockResolvedValue(undefined)
    vi.mocked(findUserById).mockResolvedValue(MOCK_USER)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await refresh(token)

    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')

    // O token anterior deve ter sido revogado
    expect(revokeRefreshToken).toHaveBeenCalledWith(storedToken.id)

    // Um novo refresh token deve ter sido persistido
    expect(createRefreshToken).toHaveBeenCalledOnce()
  })
})
