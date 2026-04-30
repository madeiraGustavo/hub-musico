/**
 * requireAuth.ts
 *
 * Helper obrigatório em todo Route Handler que requer autenticação.
 * Extrai user_id e artist_id do JWT — NUNCA aceita esses IDs do frontend.
 *
 * Regra de ouro: artist_id vem do banco, não do cliente.
 *
 * Uso:
 *   const auth = await requireAuth(req)
 *   if (auth.error) return auth.error   // NextResponse 401/403
 *   const { userId, artistId, role } = auth
 */

import { NextResponse }      from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserRole = 'admin' | 'artist' | 'editor'

export interface AuthContext {
  userId:   string
  artistId: string
  role:     UserRole
  error:    null
}

export interface AuthError {
  error: NextResponse
}

export type AuthResult = AuthContext | AuthError

interface UserRow {
  role:      UserRole
  artist_id: string | null
}

export async function requireAuth(
  allowedRoles: UserRole[] = ['admin', 'artist', 'editor'],
): Promise<AuthResult> {
  // 1. Verifica sessão via JWT (cookie HttpOnly)
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    }
  }

  // 2. Busca role e artist_id do banco — nunca do token/frontend
  const admin = createAdminClient()
  const { data: userData, error: userError } = await admin
    .from('users')
    .select('role, artist_id')
    .eq('id', user.id)
    .single<UserRow>()

  if (userError || !userData) {
    return {
      error: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 403 }),
    }
  }

  // 3. Verifica se o role tem permissão para esta rota
  if (!allowedRoles.includes(userData.role)) {
    return {
      error: NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 }),
    }
  }

  // 4. Admin não precisa de artist_id para algumas operações
  if (userData.role !== 'admin' && !userData.artist_id) {
    return {
      error: NextResponse.json({ error: 'Perfil de artista não configurado' }, { status: 403 }),
    }
  }

  return {
    userId:   user.id,
    artistId: userData.artist_id ?? '',
    role:     userData.role,
    error:    null,
  }
}

/**
 * Verifica se um recurso pertence ao artista autenticado.
 * Usar em operações de UPDATE e DELETE.
 */
export function assertOwnership(
  resourceArtistId: string,
  authContext: AuthContext,
): NextResponse | null {
  // Admin pode acessar qualquer recurso
  if (authContext.role === 'admin') return null

  if (resourceArtistId !== authContext.artistId) {
    return NextResponse.json(
      { error: 'Acesso negado: recurso pertence a outro artista' },
      { status: 403 },
    )
  }

  return null
}
