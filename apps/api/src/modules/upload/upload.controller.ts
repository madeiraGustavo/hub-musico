import type { FastifyRequest, FastifyReply } from 'fastify'
import { uploadMedia } from './upload.service.js'

/**
 * POST /upload
 *
 * Reads a multipart file upload, validates it, stores it in Supabase Storage,
 * and returns the created media asset with a signed URL.
 *
 * Requires: authenticate preHandler (injects request.user)
 * Requires: @fastify/multipart registered on the Fastify instance
 */
export async function uploadHandler(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  const data = await request.file()

  if (!data) {
    return reply.code(400).send({ error: 'Nenhum arquivo enviado' })
  }

  const buffer   = await data.toBuffer()
  const mimeType = data.mimetype
  const size     = buffer.length

  try {
    const result = await uploadMedia(request.user.artistId, { buffer, mimeType, size })
    return reply.code(201).send(result)
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    const statusCode = e.statusCode ?? 500
    const message    = statusCode < 500
      ? (e.message ?? 'Erro no upload')
      : 'Erro interno do servidor'

    return reply.code(statusCode).send({ error: message })
  }
}
