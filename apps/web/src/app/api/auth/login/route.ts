/**
 * POST /api/auth/login
 * Proxy para POST ${API_URL}/auth/login na API Fastify
 *
 * Mantido como proxy durante a Fase 2 para não quebrar o Middleware do Next.js.
 * Repassa o body e os cookies de resposta (refreshToken HttpOnly) para o browser.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  let apiRes: Response
  try {
    apiRes = await fetch(`${API_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  const data = await apiRes.json() as Record<string, unknown>
  const res  = NextResponse.json(data, { status: apiRes.status })

  // Repassa cookies Set-Cookie da API (refreshToken HttpOnly) para o browser
  const setCookie = apiRes.headers.get('set-cookie')
  if (setCookie) {
    res.headers.set('set-cookie', setCookie)
  }

  return res
}
