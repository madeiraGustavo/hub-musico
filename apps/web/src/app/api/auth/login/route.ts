/**
 * POST /api/auth/login
 * Autentica o artista com email e senha via Supabase Auth
 *
 * Segurança:
 * - Validação de input antes de qualquer operação
 * - Nunca retorna detalhes internos do erro ao cliente
 * - Sessão gerenciada via cookies HttpOnly pelo Supabase SSR
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LoginBody {
  email: string
  password: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateBody(body: unknown): body is LoginBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b['email'] === 'string' &&
    typeof b['password'] === 'string' &&
    EMAIL_RE.test(b['email']) &&
    b['password'].length >= 6
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  if (!validateBody(body)) {
    return NextResponse.json({ error: 'Email ou senha inválidos' }, { status: 400 })
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    body.email.trim().toLowerCase(),
    password: body.password,
  })

  if (error || !data.session) {
    // Não expõe detalhes do erro — apenas mensagem genérica
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id:    data.user.id,
      email: data.user.email,
    },
  })
}
