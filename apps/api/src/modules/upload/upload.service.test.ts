/**
 * upload.service.test.ts
 *
 * Unit tests for upload.service.ts
 * Requirements: 4.5, 5.2, 5.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    STORAGE_BUCKET: 'test-bucket',
  },
}))

// ── Mock storage lib ──────────────────────────────────────────────────────────
vi.mock('../../lib/storage.js', () => ({
  uploadFile:      vi.fn(),
  deleteFile:      vi.fn(),
  createSignedUrl: vi.fn(),
}))

// ── Mock prisma ───────────────────────────────────────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    mediaAsset: {
      create: vi.fn(),
    },
  },
}))

// ── Mock validateMime lib ─────────────────────────────────────────────────────
vi.mock('../../lib/validateMime.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validateMime.js')>()
  return {
    ...actual,
    validateMime: vi.fn(),
  }
})

import { uploadMedia } from './upload.service.js'
import { uploadFile, deleteFile, createSignedUrl } from '../../lib/storage.js'
import { prisma } from '../../lib/prisma.js'
import { validateMime } from '../../lib/validateMime.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a minimal Buffer with the JPEG magic bytes (FF D8 FF). */
function makeJpegBuffer(size = 1024): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0xFF
  buf[1] = 0xD8
  buf[2] = 0xFF
  return buf
}

/** Builds a minimal Buffer with the MP3/ID3 magic bytes (49 44 33). */
function makeMp3Buffer(size = 1024): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0x49
  buf[1] = 0x44
  buf[2] = 0x33
  return buf
}

const ARTIST_ID = 'artist-uuid-001'

const MOCK_ASSET = {
  id:        'asset-uuid-001',
  mimeType:  'image/jpeg',
  sizeBytes: 1024,
  createdAt: new Date('2024-01-01T00:00:00Z'),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('uploadMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── 1. MIME não permitido → 415 ───────────────────────────────────────────

  it('lança erro 415 quando o MIME type não é permitido (ex: application/pdf)', async () => {
    const file = {
      buffer:   Buffer.alloc(512),
      mimeType: 'application/pdf',
      size:     512,
    }

    await expect(uploadMedia(ARTIST_ID, file)).rejects.toMatchObject({
      statusCode: 415,
      message:    'Tipo de arquivo não permitido',
    })

    expect(uploadFile).not.toHaveBeenCalled()
  })

  // ── 2. Arquivo acima do limite → 413 ──────────────────────────────────────

  it('lança erro 413 quando o arquivo de imagem excede 5 MB', async () => {
    const oversizedFile = {
      buffer:   Buffer.alloc(6 * 1024 * 1024),
      mimeType: 'image/jpeg',
      size:     6 * 1024 * 1024, // 6 MB > 5 MB limit
    }

    await expect(uploadMedia(ARTIST_ID, oversizedFile)).rejects.toMatchObject({
      statusCode: 413,
    })

    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('lança erro 413 quando o arquivo de áudio excede 50 MB', async () => {
    const oversizedFile = {
      buffer:   Buffer.alloc(51 * 1024 * 1024),
      mimeType: 'audio/mpeg',
      size:     51 * 1024 * 1024, // 51 MB > 50 MB limit
    }

    await expect(uploadMedia(ARTIST_ID, oversizedFile)).rejects.toMatchObject({
      statusCode: 413,
    })

    expect(uploadFile).not.toHaveBeenCalled()
  })

  // ── 3. Magic bytes inválidos → 415 ────────────────────────────────────────

  it('lança erro 415 quando os magic bytes não correspondem ao MIME declarado', async () => {
    vi.mocked(validateMime).mockResolvedValue({
      valid:        false,
      detectedMime: 'image/png',
      error:        'Tipo de arquivo declarado não corresponde ao conteúdo real',
    })

    const file = {
      buffer:   makeJpegBuffer(),
      mimeType: 'image/jpeg',
      size:     1024,
    }

    await expect(uploadMedia(ARTIST_ID, file)).rejects.toMatchObject({
      statusCode: 415,
    })

    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('lança erro 415 quando o formato não é reconhecido pelos magic bytes', async () => {
    vi.mocked(validateMime).mockResolvedValue({
      valid:        false,
      detectedMime: null,
      error:        'Formato de arquivo não reconhecido',
    })

    const file = {
      buffer:   Buffer.alloc(1024), // zeros — sem magic bytes válidos
      mimeType: 'image/jpeg',
      size:     1024,
    }

    await expect(uploadMedia(ARTIST_ID, file)).rejects.toMatchObject({
      statusCode: 415,
    })

    expect(uploadFile).not.toHaveBeenCalled()
  })

  // ── 4. Falha no insert → rollback chama deleteFile ────────────────────────

  it('chama deleteFile (rollback) quando o insert em media_assets falha após upload bem-sucedido', async () => {
    vi.mocked(validateMime).mockResolvedValue({
      valid:        true,
      detectedMime: 'image/jpeg',
    })
    vi.mocked(uploadFile).mockResolvedValue(undefined)
    vi.mocked(deleteFile).mockResolvedValue(undefined)
    vi.mocked(prisma.mediaAsset.create).mockRejectedValue(
      new Error('DB constraint violation'),
    )

    const file = {
      buffer:   makeJpegBuffer(),
      mimeType: 'image/jpeg',
      size:     1024,
    }

    await expect(uploadMedia(ARTIST_ID, file)).rejects.toThrow('DB constraint violation')

    // Upload happened
    expect(uploadFile).toHaveBeenCalledOnce()

    // Rollback must have been called with the same bucket and a key matching the pattern
    expect(deleteFile).toHaveBeenCalledOnce()
    const [bucket, key] = vi.mocked(deleteFile).mock.calls[0]!
    expect(bucket).toBe('test-bucket')
    expect(key).toMatch(new RegExp(`^${ARTIST_ID}/image/[0-9a-f-]+\\.jpg$`))
  })

  // ── 5. Upload bem-sucedido → retorna URL assinada ─────────────────────────

  it('retorna id, url assinada, mimeType, sizeBytes e createdAt em caso de sucesso', async () => {
    vi.mocked(validateMime).mockResolvedValue({
      valid:        true,
      detectedMime: 'image/jpeg',
    })
    vi.mocked(uploadFile).mockResolvedValue(undefined)
    vi.mocked(prisma.mediaAsset.create).mockResolvedValue(MOCK_ASSET as never)
    vi.mocked(createSignedUrl).mockResolvedValue('https://cdn.example.com/signed-url?token=abc')

    const file = {
      buffer:   makeJpegBuffer(),
      mimeType: 'image/jpeg',
      size:     1024,
    }

    const result = await uploadMedia(ARTIST_ID, file)

    expect(result).toEqual({
      id:        MOCK_ASSET.id,
      url:       'https://cdn.example.com/signed-url?token=abc',
      mimeType:  MOCK_ASSET.mimeType,
      sizeBytes: MOCK_ASSET.sizeBytes,
      createdAt: MOCK_ASSET.createdAt,
    })

    // deleteFile must NOT have been called on success
    expect(deleteFile).not.toHaveBeenCalled()

    // Signed URL must have been requested with 1-hour expiry
    expect(createSignedUrl).toHaveBeenCalledWith('test-bucket', expect.any(String), 3600)
  })

  it('gera storageKey com UUID — nunca usa o nome do arquivo do cliente', async () => {
    vi.mocked(validateMime).mockResolvedValue({ valid: true, detectedMime: 'audio/mpeg' })
    vi.mocked(uploadFile).mockResolvedValue(undefined)
    vi.mocked(prisma.mediaAsset.create).mockResolvedValue({
      ...MOCK_ASSET,
      mimeType: 'audio/mpeg',
    } as never)
    vi.mocked(createSignedUrl).mockResolvedValue('https://cdn.example.com/audio-signed')

    const file = {
      buffer:   makeMp3Buffer(),
      mimeType: 'audio/mpeg',
      size:     2048,
    }

    await uploadMedia(ARTIST_ID, file)

    const [, key] = vi.mocked(uploadFile).mock.calls[0]!
    // Key must follow the pattern: {artistId}/{category}/{uuid}.{ext}
    expect(key).toMatch(
      new RegExp(`^${ARTIST_ID}/audio/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.mp3$`),
    )
  })
})
