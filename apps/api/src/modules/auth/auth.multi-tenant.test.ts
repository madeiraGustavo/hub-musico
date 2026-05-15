/**
 * auth.multi-tenant.test.ts
 *
 * Testes específicos para isolamento multi-tenant.
 * Valida que:
 * - Mesmo email em sites diferentes gera contas separadas
 * - Login usa siteId + email
 * - Login não autentica usuário de outro site
 * - JWT/session retornam siteId
 * - Admin bypassa isolamento
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-mt',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-mt',
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MARKETPLACE_USER = {
  id:       'user-marketplace-001',
  siteId:   'marketplace',
  email:    'cliente@email.com',
  password: '$2a$12$hashedpassword',
  role:     'client' as const,
  artistId: null,
}

const TATTOO_USER = {
  id:       'user-tattoo-001',
  siteId:   'tattoo',
  email:    'cliente@email.com', // mesmo email, site diferente
  password: '$2a$12$differenthash',
  role:     'client' as const,
  artistId: null,
}

const PLATFORM_ADMIN = {
  id:       'admin-001',
  siteId:   'platform',
  email:    'admin@artehub.com',
  password: '$2a$12$adminhash',
  role:     'admin' as const,
  artistId: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Multi-tenant auth — login isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('autentica usuário correto usando siteId + email', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(MARKETPLACE_USER)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await login('cliente@email.com', 'senha123', 'marketplace')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('cliente@email.com', 'marketplace')
    expect(result).toHaveProperty('accessToken')
    expect(result).toHaveProperty('refreshToken')

    // JWT deve conter siteId
    const decoded = jwt.decode(result.accessToken) as Record<string, unknown>
    expect(decoded.sub).toBe(MARKETPLACE_USER.id)
    expect(decoded.siteId).toBe('marketplace')
    expect(decoded.role).toBe('client')
  })

  it('não autentica usuário de outro site com mesmo email', async () => {
    // Simula: email existe no marketplace, mas login tenta no tattoo
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(null)

    await expect(
      login('cliente@email.com', 'senha123', 'tattoo'),
    ).rejects.toThrow('Credenciais inválidas')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('cliente@email.com', 'tattoo')
  })

  it('mesmo email em sites diferentes retorna tokens com siteId correto', async () => {
    // Login no marketplace
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(MARKETPLACE_USER)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const marketplaceResult = await login('cliente@email.com', 'senha123', 'marketplace')
    const marketplaceDecoded = jwt.decode(marketplaceResult.accessToken) as Record<string, unknown>

    vi.clearAllMocks()

    // Login no tattoo
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(TATTOO_USER)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const tattooResult = await login('cliente@email.com', 'senha123', 'tattoo')
    const tattooDecoded = jwt.decode(tattooResult.accessToken) as Record<string, unknown>

    // Tokens devem ter userId e siteId diferentes
    expect(marketplaceDecoded.sub).toBe(MARKETPLACE_USER.id)
    expect(marketplaceDecoded.siteId).toBe('marketplace')
    expect(tattooDecoded.sub).toBe(TATTOO_USER.id)
    expect(tattooDecoded.siteId).toBe('tattoo')
    expect(marketplaceDecoded.sub).not.toBe(tattooDecoded.sub)
  })

  it('login sem siteId usa platform como fallback', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(PLATFORM_ADMIN)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await login('admin@artehub.com', 'senha123')

    expect(findUserByEmailAndSite).toHaveBeenCalledWith('admin@artehub.com', 'platform')

    const decoded = jwt.decode(result.accessToken) as Record<string, unknown>
    expect(decoded.siteId).toBe('platform')
  })
})

describe('Multi-tenant auth — register isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite mesmo email em sites diferentes', async () => {
    // Registro no marketplace
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(null) // não existe ainda
    vi.mocked(createUser).mockResolvedValue(MARKETPLACE_USER)
    vi.mocked(createRefreshToken).mockResolvedValue(undefined)

    const result = await register('cliente@email.com', 'senha123', 'marketplace')

    expect(createUser).toHaveBeenCalledWith('marketplace', 'cliente@email.com', '$2a$12$hashed', 'client', undefined)
    expect(result).toHaveProperty('accessToken')
  })

  it('bloqueia email duplicado dentro do mesmo site', async () => {
    vi.mocked(findUserByEmailAndSite).mockResolvedValue(MARKETPLACE_USER) // já existe

    await expect(
      register('cliente@email.com', 'senha123', 'marketplace'),
    ).rejects.toThrow('Email já cadastrado neste site')

    expect(createUser).not.toHaveBeenCalled()
  })
})

describe('Multi-tenant auth — session retorna siteId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession retorna siteId do usuário', async () => {
    vi.mocked(findUserById).mockResolvedValue(MARKETPLACE_USER)

    const session = await getSession(MARKETPLACE_USER.id)

    expect(session.user.siteId).toBe('marketplace')
    expect(session.user.email).toBe('cliente@email.com')
    expect(session.user.role).toBe('client')
  })

  it('getSession retorna siteId platform para admin', async () => {
    vi.mocked(findUserById).mockResolvedValue(PLATFORM_ADMIN)

    const session = await getSession(PLATFORM_ADMIN.id)

    expect(session.user.siteId).toBe('platform')
    expect(session.user.role).toBe('admin')
  })
})
