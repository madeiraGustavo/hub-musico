/**
 * auth.controller.ts
 *
 * Recebe requests, valida input com Zod, chama o service, retorna response.
 * Não contém lógica de negócio — apenas orquestra.
 *
 * Multi-tenant: resolve site via resolveSiteFromRequest() (header X-Site-Id).
 * Cookies de refresh são isolados por tenant (ah_{siteId}_refresh).
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { LoginSchema, RegisterSchema, RefreshSchema } from './auth.schema.js'
import * as authService from './auth.service.js'
import { env } from '../../env.js'
import { resolveSiteFromRequest, type SiteConfig } from '../../lib/sites.js'

function getCookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 dias em segundos
  }
}

/**
 * Lê o refresh token do cookie correto para o site.
 * Tenta primeiro o cookie por tenant, depois o legado 'refreshToken' (backward compat).
 */
function getRefreshCookie(request: FastifyRequest, site: SiteConfig): string | undefined {
  const cookies = request.cookies as Record<string, string | undefined>
  return cookies[site.cookieName] ?? cookies['refreshToken']
}

// ── POST /auth/login ──────────────────────────────────────────────────────────

export async function loginHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const parsed = LoginSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  const site = resolveSiteFromRequest(request)

  try {
    const { accessToken, refreshToken } = await authService.login(
      parsed.data.email,
      parsed.data.password,
      site.id,
    )

    reply.setCookie(site.cookieName, refreshToken, getCookieOptions())
    // Backward compat: também seta o cookie legado para não quebrar middleware Next.js
    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(200).send({ accessToken, siteId: site.id })
  } catch {
    return reply.code(401).send({ error: 'Credenciais inválidas' })
  }
}

// ── POST /auth/register ───────────────────────────────────────────────────────

export async function registerHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const parsed = RegisterSchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(422).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
  }

  const site = resolveSiteFromRequest(request)

  try {
    const { accessToken, refreshToken } = await authService.register(
      parsed.data.email,
      parsed.data.password,
      site.id,
      parsed.data.name,
    )

    reply.setCookie(site.cookieName, refreshToken, getCookieOptions())
    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(201).send({ accessToken, siteId: site.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao registrar'
    if (message.includes('já cadastrado')) {
      return reply.code(409).send({ error: message })
    }
    return reply.code(500).send({ error: 'Erro interno' })
  }
}

// ── POST /auth/refresh ────────────────────────────────────────────────────────

export async function refreshHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const site = resolveSiteFromRequest(request)

  // Aceita refresh token do cookie por tenant, legado, ou body
  const cookieToken = getRefreshCookie(request, site)
  const parsed      = RefreshSchema.safeParse(request.body)
  const bodyToken   = parsed.success ? parsed.data.refreshToken : undefined
  const token       = cookieToken ?? bodyToken

  if (!token) {
    return reply.code(401).send({ error: 'Refresh token ausente' })
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(token)
    reply.setCookie(site.cookieName, refreshToken, getCookieOptions())
    reply.setCookie('refreshToken', refreshToken, getCookieOptions())
    return reply.code(200).send({ accessToken })
  } catch {
    return reply.code(401).send({ error: 'Refresh token inválido ou expirado' })
  }
}

// ── POST /auth/logout ─────────────────────────────────────────────────────────

export async function logoutHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const site = resolveSiteFromRequest(request)
  const token = getRefreshCookie(request, site)

  if (!token) {
    reply.clearCookie(site.cookieName, { path: '/' })
    reply.clearCookie('refreshToken', { path: '/' })
    return reply.code(400).send({ error: 'Refresh token ausente ou inválido' })
  }

  let userId: string
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }
    userId = payload.sub
  } catch {
    reply.clearCookie(site.cookieName, { path: '/' })
    reply.clearCookie('refreshToken', { path: '/' })
    return reply.code(400).send({ error: 'Refresh token ausente ou inválido' })
  }

  await authService.logout(userId)
  reply.clearCookie(site.cookieName, { path: '/' })
  reply.clearCookie('refreshToken', { path: '/' })
  return reply.code(204).send()
}

// ── GET /auth/session ─────────────────────────────────────────────────────────

export async function sessionHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const session = await authService.getSession(request.user.userId)
  return reply.code(200).send(session)
}
