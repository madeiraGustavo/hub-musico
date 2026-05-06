/**
 * PATCH  /api/dashboard/services/[id]  — atualiza serviço
 * DELETE /api/dashboard/services/[id]  — deleta serviço (apenas artist/admin)
 *
 * Segurança:
 * - assertOwnership verifica que o serviço pertence ao artista autenticado
 * - artist_id extraído do JWT via requireAuth — nunca do body
 * - double-check de ownership na query (.eq('artist_id', auth.artistId))
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, assertOwnership } from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const UpdateServiceSchema = z.object({
  icon:        z.enum(['drum','mic','music','compose','needle','camera','calendar','star']).optional(),
  title:       z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  items:       z.array(z.string().max(100)).max(10).optional(),
  price:       z.string().min(1).max(100).optional(),
  highlight:   z.boolean().optional(),
  sort_order:  z.number().int().min(0).optional(),
  active:      z.boolean().optional(),
})

interface RouteParams { params: { id: string } }

async function getServiceOrFail(id: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .select('id, artist_id')
    .eq('id', id)
    .single<{ id: string; artist_id: string }>()

  if (error || !data) return { service: null, notFound: true }
  return { service: data, notFound: false }
}

export async function PATCH(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const { service, notFound } = await getServiceOrFail(params.id)
  if (notFound || !service) {
    return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  const ownershipError = assertOwnership(service.artist_id, auth)
  if (ownershipError) return ownershipError

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = UpdateServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('artist_id', auth.artistId)   // double-check ownership na query
    .select('id, title, price, updated_at')
    .single()

  if (error) {
    console.error('PATCH /api/dashboard/services/[id]:', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  // Apenas artist e admin podem deletar
  const auth = await requireAuth(['admin', 'artist'])
  if (auth.error) return auth.error

  const { service, notFound } = await getServiceOrFail(params.id)
  if (notFound || !service) {
    return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
  }

  const ownershipError = assertOwnership(service.artist_id, auth)
  if (ownershipError) return ownershipError

  const admin = createAdminClient()
  const { error } = await admin
    .from('services')
    .delete()
    .eq('id', params.id)
    .eq('artist_id', auth.artistId)   // double-check ownership na query

  if (error) {
    console.error('DELETE /api/dashboard/services/[id]:', error.message)
    return NextResponse.json({ error: 'Erro ao deletar serviço' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
