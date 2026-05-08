/**
 * GET /api/auth/session
 * Proxy para GET ${API_URL}/auth/session na API Fastify
 *
 * Mantido como proxy durante a Fase 2 para não quebrar o Middleware do Next.js.
 * Lê o accessToken do header Authorization e o repassa para a API.
 */

import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authorization = req.headers.get('authorization') ?? ''

  let apiRes: Response
  try {
    apiRes = await fetch(`${API_URL}/auth/session`, {
      method:  'GET',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authorization,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 503 })
  }

  const data = await apiRes.json() as Record<string, unknown>
  return NextResponse.json(data, { status: apiRes.status })
}
