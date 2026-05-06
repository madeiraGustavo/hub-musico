import { z } from 'zod'

export const ALLOWED_MIMES = ['audio/mpeg','audio/wav','image/jpeg','image/png','image/webp'] as const

export const SIZE_LIMITS = {
  audio: 50 * 1024 * 1024, // 50 MB
  image:  5 * 1024 * 1024, //  5 MB
} as const

export const UploadQuerySchema = z.object({
  mimeType:  z.enum(ALLOWED_MIMES),
  sizeBytes: z.coerce.number().int().positive(),
})

export type UploadQuery = z.infer<typeof UploadQuerySchema>
