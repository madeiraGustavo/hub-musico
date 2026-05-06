import { z } from 'zod'

const PLATFORMS = ['youtube','spotify','soundcloud','outro'] as const

export const CreateProjectSchema = z.object({
  title:               z.string().min(2).max(100),
  description:         z.string().max(1000).optional(),
  year_label:          z.string().max(20).optional(),
  platform:            z.enum(PLATFORMS),
  tags:                z.array(z.string().max(50)).max(10).default([]),
  href:                z.string().url(),
  thumbnail_url:       z.string().url().nullable().optional(),
  spotify_id:          z.string().max(50).nullable().optional(),
  featured:            z.boolean().default(false),
  background_style:    z.string().max(200).optional(),
  background_position: z.string().max(50).optional(),
  background_size:     z.string().max(50).optional(),
  sort_order:          z.number().int().min(0).default(0),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

export type CreateProjectBody = z.infer<typeof CreateProjectSchema>
export type UpdateProjectBody = z.infer<typeof UpdateProjectSchema>
