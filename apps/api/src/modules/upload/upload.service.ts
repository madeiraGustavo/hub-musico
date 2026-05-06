/**
 * upload.service.ts — stub para Fase 2
 *
 * TODO Fase 2: implementar uploadMedia com:
 * 1. Validação de MIME por magic bytes (não apenas Content-Type)
 * 2. Geração de storageKey via UUID (nunca usar nome do cliente)
 * 3. Upload para Supabase Storage via storage.uploadFile()
 * 4. Insert em media_assets via Prisma
 * 5. Rollback: se o insert falhar, chamar storage.deleteFile() antes de lançar erro
 * 6. Retornar URL assinada (expira em 1h) — nunca a storageKey direta
 */

export async function uploadMedia(_artistId: string, _file: unknown): Promise<never> {
  throw Object.assign(new Error('Not Implemented'), { statusCode: 501 })
}
