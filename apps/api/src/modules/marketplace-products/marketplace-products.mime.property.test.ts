/**
 * marketplace-products.mime.property.test.ts
 *
 * Property 8: MIME validation by magic bytes
 *
 * Validates: Requirements 3.2, 3.3, 12.5
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateMime, SIZE_LIMITS } from '../../lib/validateMime.js'

fc.configureGlobal({ numRuns: 100 })

// Magic bytes for valid image types
const JPEG_MAGIC = [0xFF, 0xD8, 0xFF]
const PNG_MAGIC = [0x89, 0x50, 0x4E, 0x47]
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]

function makeBuffer(magic: number[], size: number = 16): ArrayBuffer {
  const buf = new Uint8Array(size)
  magic.forEach((byte, i) => { buf[i] = byte })
  return buf.buffer
}

describe('Property 8: MIME validation by magic bytes', () => {
  it(
    'JPEG magic bytes with correct declared MIME are accepted',
    async () => {
      const buffer = makeBuffer(JPEG_MAGIC)
      const result = await validateMime(buffer, 'image/jpeg')
      expect(result.valid).toBe(true)
      expect(result.detectedMime).toBe('image/jpeg')
    },
  )

  it(
    'PNG magic bytes with correct declared MIME are accepted',
    async () => {
      const buffer = makeBuffer(PNG_MAGIC)
      const result = await validateMime(buffer, 'image/png')
      expect(result.valid).toBe(true)
      expect(result.detectedMime).toBe('image/png')
    },
  )

  it(
    'WebP magic bytes with correct declared MIME are accepted',
    async () => {
      const buffer = makeBuffer(WEBP_MAGIC)
      const result = await validateMime(buffer, 'image/webp')
      expect(result.valid).toBe(true)
      expect(result.detectedMime).toBe('image/webp')
    },
  )

  it(
    'mismatched declared MIME vs detected MIME is rejected',
    async () => {
      // JPEG magic bytes but declared as PNG
      const buffer = makeBuffer(JPEG_MAGIC)
      const result = await validateMime(buffer, 'image/png')
      expect(result.valid).toBe(false)
    },
  )

  it(
    'random bytes (no valid magic) are rejected',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 16, maxLength: 16 })
            .filter((bytes) => {
              // Exclude valid magic byte sequences
              if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return false
              if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return false
              if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return false
              if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return false
              if (bytes[0] === 0xFF && (bytes[1] === 0xFB || bytes[1] === 0xF3 || bytes[1] === 0xF2)) return false
              if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) return false
              return true
            }),
          async (bytes) => {
            const buf = new Uint8Array(bytes).buffer
            const result = await validateMime(buf, 'image/jpeg')
            expect(result.valid).toBe(false)
          },
        ),
      )
    },
  )

  it(
    'file size limit is 5 MB for images',
    () => {
      expect(SIZE_LIMITS.image).toBe(5 * 1024 * 1024)
    },
  )

  it(
    'SVG (blocked MIME) is always rejected regardless of content',
    async () => {
      const buffer = makeBuffer([0x3C, 0x73, 0x76, 0x67]) // <svg
      const result = await validateMime(buffer, 'image/svg+xml')
      expect(result.valid).toBe(false)
    },
  )
})
