import { z } from 'zod'

const ICONS = ['drum','mic','music','compose','needle','camera','calendar','star'] as const

export const CreateServiceSchema = z.object({
  icon:        z.enum(ICONS),
  title:       z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  items:       z.array(z.string().max(100)).max(10).default([]),
  price:       z.string().min(1).max(100),
  highlight:   z.boolean().default(false),
  sort_order:  z.number().int().min(0).default(0),
})

export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  active: z.boolean().optional(),
})

export type CreateServiceBody = z.infer<typeof CreateServiceSchema>
export type UpdateServiceBody = z.infer<typeof UpdateServiceSchema>
