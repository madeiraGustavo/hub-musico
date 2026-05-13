import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name:      z.string().min(2).max(100),
  icon:      z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
})

export const UpdateCategorySchema = z.object({
  name:      z.string().min(2).max(100).optional(),
  icon:      z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

export type CreateCategoryBody = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryBody = z.infer<typeof UpdateCategorySchema>
