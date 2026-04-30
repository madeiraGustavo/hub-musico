/**
 * PATCH  /api/dashboard/tracks/[id]  — atualiza track
 * DELETE /api/dashboard/tracks/[id]  — deleta track (apenas artist/admin)
 *
 * Segurança:
 * - assertOwnership verifica que a track pertence ao artista autenticado
 * - ID vem da URL mas ownership é validado no banco
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, assertOwnership } from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateTrackSchema = z.object({
  title:       z.string().min(2).max(100).optional(),
  genre:       z.enum(['piano','jazz','ambient','orquestral','rock','demo','outro']).optional(),
  genre_label: z.string().min(1).max(50).optional(),
  duration:    z.string().max(10).optional(),
  key:         z.string().max(10).optional(),
  is_public:   z.boolean().optional(),
  sort_order:  z.number().int().min(0).optional(),
})

interface RouteParams { params: { id: string } }

async function getTrackOrFail(id: string, artistId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tracks')
    .select('id, artist_id')
    .eq('id', id)
    .single<{ id: string; artist_id: string }>()

  if (error || !data) return { track: null, notFound: true }
  return { track: data, notFound: false }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const { track, notFound } = await getTrackOrFail(params.id, auth.artistId)
  if (notFound || !track) return NextResponse.json({ error: 'Faixa não encontrada' }, { status: 404 })

  const ownershipError = assertOwnership(track.artist_id, auth)
  if (ownershipError) return ownershipError

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = UpdateTrackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tracks')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('artist_id', auth.artistId)   // double-check ownership na query
    .select('id, title, genre, updated_at')
    .single()

  if (error) {
    console.error('PATCH /api/dashboard/tracks/[id]:', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar faixa' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  // Apenas artist e admin podem deletar
  const auth = await requireAuth(['admin', 'artist'])
  if (auth.error) return auth.error

  const { track, notFound } = await getTrackOrFail(params.id, auth.artistId)
  if (notFound || !track) return NextResponse.json({ error: 'Faixa não encontrada' }, { status: 404 })

  const ownershipError = assertOwnership(track.artist_id, auth)
  if (ownershipError) return ownershipError

  const admin = createAdminClient()
  const { error } = await admin
    .from('tracks')
    .delete()
    .eq('id', params.id)
    .eq('artist_id', auth.artistId)   // double-check ownership na query

  if (error) {
    console.error('DELETE /api/dashboard/tracks/[id]:', error.message)
    return NextResponse.json({ error: 'Erro ao deletar faixa' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
