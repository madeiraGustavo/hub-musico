/**
 * GET  /api/dashboard/projects  — lista projetos do artista autenticado
 * POST /api/dashboard/projects  — cria novo projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth }       from '@/lib/auth/requireAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  title:              z.string().min(2).max(100),
  description:        z.string().max(1000).optional(),
  year_label:         z.string().max(20).optional(),
  platform:           z.enum(['youtube','spotify','soundcloud','outro']),
  tags:               z.array(z.string().max(50)).max(10).default([]),
  href:               z.string().url(),
  thumbnail_url:      z.string().url().nullable().optional(),
  spotify_id:         z.string().max(50).nullable().optional(),
  featured:           z.boolean().default(false),
  background_style:   z.string().max(200).optional(),
  background_position: z.string().max(50).optional(),
  background_size:    z.string().max(50).optional(),
  sort_order:         z.number().int().min(0).default(0),
})

export async function GET(): Promise<NextResponse> {
  const auth = await requireAuth(['admin', 'artist', 'editor'])
  if (auth.error) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .select('id, title, platform, tags, href, featured, status, sort_order, created_at')
    .eq('artist_id', auth.artistId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('GET /api/dashboard/projects:', error.message)
    return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 })
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

  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('projects')
    .insert({ ...parsed.data, artist_id: auth.artistId })
    .select('id, title, platform, created_at')
    .single()

  if (error) {
    console.error('POST /api/dashboard/projects:', error.message)
    return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
