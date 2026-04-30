/**
 * POST /api/auth/logout
 * Encerra a sessão do artista e limpa os cookies
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(): Promise<NextResponse> {
  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
