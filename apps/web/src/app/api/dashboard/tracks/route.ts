/**
 * GET  /api/dashboard/tracks  — lista tracks do artista autenticado
 * POST /api/dashboard/tracks  — cria nova track
 *
 * Segurança:
 * - artist_id extraído do JWT via requireAuth — nunca do body
 * - WHERE artist_id = ? em toda query
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth }      from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateTrackSchema = z.object({
  title:       z.string().min(2).max(100),
  genre:       z.enum(['piano','jazz','ambient','orquestral','rock','demo','outro']),
  genre_label: z.string().min(1).max(50),
  duration:    z.string().max(10).optional(),
  key:         z.string().max(10).optional(),
  is_public:   z.boolean().default(true),
  sort_order:  z.number().int().min(0).default(0),
})

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tracks')
    .select('id, title, genre, genre_label, duration, key, is_public, sort_order, created_at')
    .eq('artist_id', auth.artistId)   // ownership: sempre filtra pelo artista autenticado
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('GET /api/dashboard/tracks:', error.message)
    return NextResponse.json({ error: 'Erro ao buscar faixas' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = CreateTrackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tracks')
    .insert({ ...parsed.data, artist_id: auth.artistId })  // artist_id vem do JWT
    .select('id, title, genre, genre_label, created_at')
    .single()

  if (error) {
    console.error('POST /api/dashboard/tracks:', error.message)
    return NextResponse.json({ error: 'Erro ao criar faixa' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
