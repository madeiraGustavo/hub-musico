import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  tagline:  z.string().max(300).optional(),
  bio:      z.array(z.string().max(1000)).max(5).optional(),
  location: z.string().max(100).optional(),
  reach:    z.string().max(100).optional(),
  email:    z.string().email().optional(),
  whatsapp: z.string().max(20).optional(),
  skills:   z.array(z.string().max(50)).max(20).optional(),
  tools:    z.array(z.string().max(50)).max(20).optional(),
})

export type UpdateProfileBody = z.infer<typeof UpdateProfileSchema>
