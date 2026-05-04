/**
 * middleware.ts
 * Atualiza a sessão do Supabase em cada request
 * Protege rotas do dashboard que requerem autenticação
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PROTECTED_PATHS = ['/dashboard']

// Rotas de API que requerem autenticação — validadas no middleware como camada extra
// A validação principal continua sendo feita em cada Route Handler via requireAuth()
const PROTECTED_API_PATHS = [
  '/api/dashboard',
  '/api/upload',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return res

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  // Atualiza a sessão (refresh token se necessário)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected    = PROTECTED_PATHS.some(p => req.nextUrl.pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API_PATHS.some(p => req.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // API routes: retorna 401 em vez de redirecionar
  if (isProtectedApi && !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|data/).*)',
  ],
}
