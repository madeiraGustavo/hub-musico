/**
 * GET   /api/dashboard/profile  — retorna perfil do artista autenticado
 * PATCH /api/dashboard/profile  — atualiza perfil
 *
 * Segurança:
 * - artist_id sempre do JWT — nunca do body
 * - Editor pode atualizar bio/skills mas não email/contato
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth }       from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  tagline:  z.string().max(300).optional(),
  bio:      z.array(z.string().max(1000)).max(5).optional(),
  location: z.string().max(100).optional(),
  reach:    z.string().max(100).optional(),
  skills:   z.array(z.string().max(50)).max(20).optional(),
  tools:    z.array(z.string().max(50)).max(20).optional(),
})

// Campos que apenas artist/admin podem alterar
const SensitiveFieldsSchema = z.object({
  email:    z.string().email().optional(),
  whatsapp: z.string().max(20).optional(),
})

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('artists')
    .select('id, name, slug, tagline, bio, location, reach, email, whatsapp, skills, tools, is_active, created_at')
    .eq('id', auth.artistId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = UpdateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  let updates: Record<string, unknown> = { ...parsed.data }

  // Campos sensíveis — apenas artist e admin
  if (auth.role === 'artist' || auth.role === 'admin') {
    const sensitive = SensitiveFieldsSchema.safeParse(body)
    if (sensitive.success) {
      updates = { ...updates, ...sensitive.data }
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('artists')
    .update(updates)
    .eq('id', auth.artistId)   // ownership garantido pelo JWT
    .select('id, name, tagline, updated_at')
    .single()

  if (error) {
    console.error('PATCH /api/dashboard/profile:', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
