/**
 * GET /api/auth/session
 * Retorna os dados da sessão atual (usuário autenticado)
 * Usado pelo frontend para verificar se está logado
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id:    user.id,
      email: user.email,
    },
  })
}
