import { z } from 'zod'

const GENRES = ['piano','jazz','ambient','orquestral','rock','demo','outro'] as const

export const CreateTrackSchema = z.object({
  title:       z.string().min(2).max(100),
  genre:       z.enum(GENRES),
  genre_label: z.string().min(1).max(50),
  duration:    z.string().max(10).optional(),
  key:         z.string().max(10).optional(),
  is_public:   z.boolean().default(true),
  sort_order:  z.number().int().min(0).default(0),
})

export const UpdateTrackSchema = CreateTrackSchema.partial()

export type CreateTrackBody = z.infer<typeof CreateTrackSchema>
export type UpdateTrackBody = z.infer<typeof UpdateTrackSchema>
