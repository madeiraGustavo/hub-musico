/**
 * auth.controller.ts
 *
 * Recebe requests, valida input com Zod, chama o service, retorna response.
 * Não contém lógica de negócio — apenas orquestra.
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { LoginSchema, RefreshSchema } from './auth.schema.js'
import * as authService from './auth.service.js'

const REFRESH_COOKIE = 'refreshToken'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path:     '/',
  maxAge:   60 * 60 * 24 * 7, // 7 dias em segundos
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

  try {
    const { accessToken, refreshToken } = await authService.login(
      parsed.data.email,
      parsed.data.password,
    )

    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
    return reply.code(200).send({ accessToken })
  } catch {
    return reply.code(401).send({ error: 'Credenciais inválidas' })
  }
}

// ── POST /auth/refresh ────────────────────────────────────────────────────────

export async function refreshHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  // Aceita refresh token do cookie HttpOnly ou do body
  const cookieToken = (request.cookies as Record<string, string | undefined>)[REFRESH_COOKIE]
  const parsed      = RefreshSchema.safeParse(request.body)
  const bodyToken   = parsed.success ? parsed.data.refreshToken : undefined
  const token       = cookieToken ?? bodyToken

  if (!token) {
    return reply.code(401).send({ error: 'Refresh token ausente' })
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(token)
    reply.setCookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS)
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
  await authService.logout(request.user.userId)
  reply.clearCookie(REFRESH_COOKIE, { path: '/' })
  return reply.code(204).send()
}

// ── GET /auth/session ─────────────────────────────────────────────────────────

export async function sessionHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const session = await authService.getSession(request.user.userId)
  return reply.code(200).send({ data: session })
}
