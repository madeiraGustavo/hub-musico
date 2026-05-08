import { randomUUID } from 'crypto'
import { env } from '../../env.js'
import { prisma } from '../../lib/prisma.js'
import { uploadFile, deleteFile, createSignedUrl } from '../../lib/storage.js'
import {
  getMediaCategory,
  validateMime,
  SIZE_LIMITS,
} from '../../lib/validateMime.js'

export interface UploadFile {
  buffer:   Buffer
  mimeType: string
  size:     number
}

export interface UploadResult {
  id:        string
  url:       string
  mimeType:  string
  sizeBytes: number
  createdAt: Date
}

/** Maps a MIME type to its canonical file extension. */
function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/wav':  'wav',
    'audio/flac': 'flac',
  }
  return map[mimeType] ?? 'bin'
}

/**
 * Uploads a media file for an artist.
 *
 * Steps:
 * 1. Validate MIME category (415 if not allowed)
 * 2. Validate file size against category limit (413 if exceeded)
 * 3. Validate magic bytes (415 if mismatch or unrecognised)
 * 4. Generate a UUID-based storage key — never uses the client-supplied filename
 * 5. Upload to Supabase Storage
 * 6. Insert record in media_assets via Prisma
 *    Rollback: if insert fails, delete the uploaded file before re-throwing
 * 7. Return a signed URL (expires in 1 h) — never the raw storageKey
 */
export async function uploadMedia(
  artistId: string,
  file:     UploadFile,
): Promise<UploadResult> {
  const { buffer, mimeType, size } = file

  // 1. Validate MIME category
  const category = getMediaCategory(mimeType)
  if (!category) {
    const err = Object.assign(new Error('Tipo de arquivo não permitido'), { statusCode: 415 })
    throw err
  }

  // 2. Validate size
  const limit = SIZE_LIMITS[category]
  if (size > limit) {
    const err = Object.assign(
      new Error(`Arquivo excede o limite de ${limit / (1024 * 1024)} MB`),
      { statusCode: 413 },
    )
    throw err
  }

  // 3. Validate magic bytes
  const validation = await validateMime(buffer.buffer as ArrayBuffer, mimeType)
  if (!validation.valid) {
    const err = Object.assign(
      new Error(validation.error ?? 'Tipo de arquivo não permitido'),
      { statusCode: 415 },
    )
    throw err
  }

  // 4. Generate storage key — UUID-based, never client-supplied name
  const ext = mimeToExt(mimeType)
  const storageKey = `${artistId}/${category}/${randomUUID()}.${ext}`

  // 5. Upload to Supabase Storage
  await uploadFile(env.STORAGE_BUCKET, storageKey, buffer, mimeType)

  // 6. Insert in media_assets — rollback on failure
  let asset: { id: string; mimeType: string; sizeBytes: number; createdAt: Date }
  try {
    asset = await prisma.mediaAsset.create({
      data: {
        artistId,
        mediaType:  category === 'audio' ? 'audio' : 'image',
        storageKey,
        mimeType,
        sizeBytes:  size,
      },
      select: {
        id:        true,
        mimeType:  true,
        sizeBytes: true,
        createdAt: true,
      },
    })
  } catch (dbError) {
    // Rollback: remove the uploaded file to keep storage and DB in sync
    await deleteFile(env.STORAGE_BUCKET, storageKey).catch(() => {
      // Best-effort rollback — log but don't mask the original error
    })
    throw dbError
  }

  // 7. Return signed URL (1 hour expiry) — never the raw storageKey
  const url = await createSignedUrl(env.STORAGE_BUCKET, storageKey, 3600)

  return {
    id:        asset.id,
    url,
    mimeType:  asset.mimeType,
    sizeBytes: asset.sizeBytes,
    createdAt: asset.createdAt,
  }
}
