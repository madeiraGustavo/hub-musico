/**
 * POST /api/upload
 * Upload seguro de mídia (áudio e imagem)
 *
 * Segurança (OWASP A08):
 * - Requer autenticação — sem token = 401
 * - Valida MIME por magic bytes — não confia no Content-Type do cliente
 * - Bloqueia SVG e tipos perigosos explicitamente
 * - Limita tamanho: áudio 50MB, imagem 5MB
 * - Nome do arquivo gerado pelo servidor (UUID) — nunca usa nome do cliente
 * - Arquivo vai para Supabase Storage via service_role (server-side only)
 * - Registra metadata em media_assets via admin client
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  validateMime,
  getMediaCategory,
  SIZE_LIMITS,
} from '@/lib/upload/validateMime'
import { randomUUID } from 'crypto'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'media-assets'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Verifica autenticação
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Busca o artist_id do usuário autenticado
  const admin = createAdminClient()
  const { data: artist, error: artistError } = await admin
    .from('artists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (artistError || !artist) {
    return NextResponse.json({ error: 'Perfil de artista não encontrado' }, { status: 403 })
  }

  // 3. Lê o FormData
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'FormData inválido' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400 })
  }

  const declaredMime = file.type.toLowerCase()

  // 4. Valida tamanho antes de ler o buffer (fail fast)
  const category = getMediaCategory(declaredMime)
  if (!category) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 415 })
  }

  const limit = SIZE_LIMITS[category]
  if (file.size > limit) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Limite: ${limit / 1024 / 1024}MB` },
      { status: 413 },
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 })
  }

  // 5. Valida MIME por magic bytes
  const buffer = await file.arrayBuffer()
  const mimeResult = await validateMime(buffer, declaredMime)

  if (!mimeResult.valid) {
    return NextResponse.json(
      { error: mimeResult.error ?? 'Arquivo inválido' },
      { status: 415 },
    )
  }

  // 6. Gera nome seguro — nunca usa nome do cliente
  const ext = declaredMime.split('/')[1] ?? 'bin'
  const storageKey = `${artist.id}/${category}/${randomUUID()}.${ext}`

  // 7. Faz upload para o Supabase Storage via admin (service_role)
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storageKey, buffer, {
      contentType:  declaredMime,
      cacheControl: '3600',
      upsert:       false,
    })

  if (uploadError) {
    console.error('upload/route: erro no storage', uploadError.message)
    return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
  }

  // 8. Registra metadata em media_assets
  const { data: asset, error: dbError } = await admin
    .from('media_assets')
    .insert({
      artist_id:     artist.id,
      media_type:    category,
      storage_key:   storageKey,
      original_name: null, // nunca salva nome original do cliente
      mime_type:     declaredMime,
      size_bytes:    file.size,
    })
    .select('id, storage_key, mime_type, size_bytes, created_at')
    .single()

  if (dbError || !asset) {
    // Rollback: remove o arquivo do storage se o insert falhou
    await admin.storage.from(BUCKET).remove([storageKey])
    console.error('upload/route: erro ao registrar asset', dbError?.message)
    return NextResponse.json({ error: 'Erro ao registrar arquivo' }, { status: 500 })
  }

  // 9. Retorna URL assinada (expira em 1h) — nunca a storage_key direta
  const { data: signedUrl } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, 3600)

  return NextResponse.json({
    id:         asset.id,
    url:        signedUrl?.signedUrl ?? null,
    mimeType:   asset.mime_type,
    sizeBytes:  asset.size_bytes,
    createdAt:  asset.created_at,
  }, { status: 201 })
}
