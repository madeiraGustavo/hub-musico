/**
 * POST /api/auth/logout
 * Proxy para POST ${API_URL}/auth/logout na API Fastify
 *
 * Repassa o cookie `refreshToken` via header Cookie para que a API revogue a sessão.
 * Repassa o header `Authorization` se disponível (opcional — compatibilidade).
 * Repassa cookies Set-Cookie da resposta (limpeza do refreshToken HttpOnly) para o browser.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(req: NextRequest): Promise<NextResponse> {
  const headers: Record<string, string> = {}

  // Repassa cookies para que a API leia o refreshToken
  const cookie = req.headers.get('cookie')
  if (cookie) {
    headers['cookie'] = cookie
  }

  // Repassa Authorization se disponível (opcional — para compatibilidade)
  const authorization = req.headers.get('authorization')
  if (authorization) {
    headers['authorization'] = authorization
  }

  let apiRes: Response
  try {
    apiRes = await fetch(`${API_URL}/auth/logout`, {
      method:  'POST',
      headers,
    })
  } catch {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  // Para respostas 204 (sem corpo), retornar resposta vazia com status correto
  let data: Record<string, unknown> = {}
  if (apiRes.status !== 204) {
    try {
      data = await apiRes.json() as Record<string, unknown>
    } catch {
      // corpo vazio ou não-JSON — manter objeto vazio
    }
  }

  const res = NextResponse.json(data, { status: apiRes.status })

  // Repassa cookies Set-Cookie da API (limpeza do refreshToken HttpOnly) para o browser
  const setCookie = apiRes.headers.get('set-cookie')
  if (setCookie) {
    res.headers.set('set-cookie', setCookie)
  }

  return res
}
