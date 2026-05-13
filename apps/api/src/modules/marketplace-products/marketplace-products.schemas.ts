import { z } from 'zod'

export const CreateProductSchema = z.object({
  title:            z.string().min(1).max(150).refine(s => s.trim().length > 0, { message: 'Título não pode ser vazio' }),
  description:      z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  type:             z.enum(['FIXED_PRICE', 'QUOTE_ONLY']),
  basePrice:        z.number().min(0.01).max(999999.99).optional(),
  active:           z.boolean().default(false),
  featured:         z.boolean().default(false),
  customizable:     z.boolean().default(false),
  stock:            z.number().int().min(0).max(99999).optional(),
  widthCm:          z.number().min(0.1).max(99999.9).optional(),
  heightCm:         z.number().min(0.1).max(99999.9).optional(),
  material:         z.string().max(100).optional(),
  color:            z.string().max(50).optional(),
  categoryId:       z.string().uuid(),
  sortOrder:        z.number().int().min(0).default(0),
})

export const UpdateProductSchema = z.object({
  title:            z.string().min(1).max(150).refine(s => s.trim().length > 0, { message: 'Título não pode ser vazio' }).optional(),
  description:      z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  type:             z.enum(['FIXED_PRICE', 'QUOTE_ONLY']).optional(),
  basePrice:        z.number().min(0.01).max(999999.99).nullable().optional(),
  active:           z.boolean().optional(),
  featured:         z.boolean().optional(),
  customizable:     z.boolean().optional(),
  stock:            z.number().int().min(0).max(99999).nullable().optional(),
  widthCm:          z.number().min(0.1).max(99999.9).nullable().optional(),
  heightCm:         z.number().min(0.1).max(99999.9).nullable().optional(),
  material:         z.string().max(100).nullable().optional(),
  color:            z.string().max(50).nullable().optional(),
  categoryId:       z.string().uuid().optional(),
  sortOrder:        z.number().int().min(0).optional(),
})

export const ListProductsQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export const PublicListProductsQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(50).default(12),
  categoryId: z.string().uuid().optional(),
  featured:   z.coerce.boolean().optional(),
})

export type CreateProductBody = z.infer<typeof CreateProductSchema>
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>
