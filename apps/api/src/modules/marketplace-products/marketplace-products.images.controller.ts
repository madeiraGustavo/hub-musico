import type { FastifyRequest, FastifyReply } from 'fastify'
import { randomUUID } from 'crypto'
import { prisma } from '../../lib/prisma.js'
import { uploadFile, deleteFile } from '../../lib/storage.js'
import { validateMime, SIZE_LIMITS } from '../../lib/validateMime.js'
import * as repo from './marketplace-products.repository.js'
import type { AuthContext } from '../../types/fastify.js'

const BUCKET = 'marketplace-images'
const MAX_IMAGES_PER_PRODUCT = 10

// ── POST /dashboard/marketplace/products/:id/images ───────────────────────────

export async function uploadImageHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  // Ownership check
  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }
  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // Check image limit
  const imageCount = await repo.countProductImages(id)
  if (imageCount >= MAX_IMAGES_PER_PRODUCT) {
    return reply.code(422).send({ error: 'Limite máximo de 10 imagens por produto atingido' })
  }

  // Get uploaded file
  const file = await request.file()
  if (!file) {
    return reply.code(400).send({ error: 'Nenhum arquivo enviado' })
  }

  const buffer = await file.toBuffer()

  // Validate file size
  if (buffer.length > SIZE_LIMITS.image) {
    return reply.code(422).send({ error: 'Tamanho do arquivo excede o limite de 5 MB' })
  }

  // Validate MIME by magic bytes
  const mimeResult = await validateMime(buffer.buffer, file.mimetype)
  if (!mimeResult.valid) {
    return reply.code(422).send({ error: mimeResult.error ?? 'Tipo de arquivo inválido' })
  }

  // Only allow image types
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedImageMimes.includes(mimeResult.detectedMime!)) {
    return reply.code(422).send({ error: 'Apenas imagens JPEG, PNG e WebP são permitidas' })
  }

  // Upload to storage
  const ext = mimeResult.detectedMime === 'image/jpeg' ? 'jpg'
    : mimeResult.detectedMime === 'image/png' ? 'png'
    : 'webp'
  const storageKey = `${artistId}/${id}/${randomUUID()}.${ext}`

  await uploadFile(BUCKET, storageKey, buffer, mimeResult.detectedMime!)

  // Get public URL
  const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey}`

  // Save to DB with next sortOrder
  const image = await prisma.marketplaceProductImage.create({
    data: {
      productId: id,
      url,
      sortOrder: imageCount,
    },
    select: { id: true, url: true, alt: true, sortOrder: true },
  })

  return reply.code(201).send({ data: image })
}

// ── PATCH /dashboard/marketplace/products/:id/images/reorder ──────────────────

export async function reorderImagesHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id } = request.params

  // Ownership check
  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }
  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  const body = request.body as Array<{ id: string; sortOrder: number }>
  if (!Array.isArray(body)) {
    return reply.code(400).send({ error: 'Body deve ser um array de { id, sortOrder }' })
  }

  // Update sortOrder for each image in a transaction
  await prisma.$transaction(
    body.map((item) =>
      prisma.marketplaceProductImage.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  )

  return reply.code(200).send({ data: { reordered: body.length } })
}

// ── DELETE /dashboard/marketplace/products/:id/images/:imageId ─────────────────

export async function deleteImageHandler(
  request: FastifyRequest<{ Params: { id: string; imageId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { artistId } = request.user as AuthContext
  const { id, imageId } = request.params

  // Ownership check
  const product = await repo.findById(id)
  if (!product) {
    return reply.code(404).send({ error: 'Não encontrado' })
  }
  if (product.artistId !== artistId) {
    return reply.code(403).send({ error: 'Acesso negado' })
  }

  // Find the image
  const image = await prisma.marketplaceProductImage.findUnique({
    where: { id: imageId },
    select: { id: true, url: true, productId: true },
  })

  if (!image || image.productId !== id) {
    return reply.code(404).send({ error: 'Imagem não encontrada' })
  }

  // Extract storage key from URL
  const urlPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  const storageKey = image.url.replace(urlPrefix, '')

  // Delete from storage (best effort — orphaned files are acceptable)
  try {
    await deleteFile(BUCKET, storageKey)
  } catch {
    // Log but don't fail — orphaned files can be cleaned later
  }

  // Delete from DB
  await prisma.marketplaceProductImage.delete({ where: { id: imageId } })

  return reply.code(204).send()
}
