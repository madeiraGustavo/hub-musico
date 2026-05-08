/**
 * middleware.ts
 *
 * Defesa em profundidade — verifica presença do cookie `refreshToken` (HttpOnly)
 * como proxy de autenticação. O cookie é gerenciado pela API Fastify e só existe
 * quando o usuário tem uma sessão ativa.
 *
 * Nota: o access token é armazenado em memória no cliente (nunca em cookie),
 * portanto o Middleware não pode verificá-lo diretamente. A verificação real do
 * JWT é responsabilidade da API Fastify — o Middleware é apenas uma camada de
 * defesa leve para evitar renderização desnecessária de páginas protegidas.
 *
 * Regra: adicionar qualquer nova rota sensível em PROTECTED_PATHS ou PROTECTED_API_PATHS.
 * Nunca depender apenas da proteção de UI.
 */

import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/dashboard']

const PROTECTED_API_PATHS = [
  '/api/dashboard',
  '/api/upload',
]

export function middleware(req: NextRequest) {
  // O cookie `refreshToken` é HttpOnly e definido pela API Fastify após login.
  // Sua presença indica que o usuário tem (ou teve) uma sessão válida.
  const hasRefreshToken = req.cookies.has('refreshToken')

  const isProtected    = PROTECTED_PATHS.some(p => req.nextUrl.pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API_PATHS.some(p => req.nextUrl.pathname.startsWith(p))

  if (isProtected && !hasRefreshToken) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // API routes: retorna 401 em vez de redirecionar
  if (isProtectedApi && !hasRefreshToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|data/).*)',
  ],
}
