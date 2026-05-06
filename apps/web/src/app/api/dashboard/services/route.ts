/**
 * GET  /api/dashboard/services  — lista serviços do artista autenticado
 * POST /api/dashboard/services  — cria novo serviço
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth }       from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateServiceSchema = z.object({
  icon:        z.enum(['drum','mic','music','compose','needle','camera','calendar','star']),
  title:       z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  items:       z.array(z.string().max(100)).max(10).default([]),
  price:       z.string().min(1).max(100),
  highlight:   z.boolean().default(false),
  sort_order:  z.number().int().min(0).default(0),
})

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .select('id, icon, title, description, items, price, highlight, sort_order, active, created_at')
    .eq('artist_id', auth.artistId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('GET /api/dashboard/services:', error.message)
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 })
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

  const parsed = CreateServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('services')
    .insert({ ...parsed.data, artist_id: auth.artistId })
    .select('id, title, price, created_at')
    .single()

  if (error) {
    console.error('POST /api/dashboard/services:', error.message)
    return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
