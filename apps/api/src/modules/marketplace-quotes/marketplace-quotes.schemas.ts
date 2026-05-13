import { z } from 'zod'

export const CreateQuoteSchema = z.object({
  productId:      z.string().uuid(),
  requesterName:  z.string().min(1).max(100),
  requesterEmail: z.string().email().max(255),
  requesterPhone: z.string().max(20).optional(),
  message:        z.string().min(1).max(1000),
  widthCm:        z.number().min(1.0).max(5000.0).optional(),
  heightCm:       z.number().min(1.0).max(5000.0).optional(),
  quantity:       z.number().int().min(1).max(10000).default(1),
})

export const UpdateQuoteStatusSchema = z.object({
  status:          z.enum(['ANSWERED', 'REJECTED', 'ACCEPTED', 'EXPIRED']),
  responseMessage: z.string().max(2000).optional(),
})

export const ListQuotesQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status:   z.enum(['PENDING', 'ANSWERED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
})

export type CreateQuoteBody = z.infer<typeof CreateQuoteSchema>
export type UpdateQuoteStatusBody = z.infer<typeof UpdateQuoteStatusSchema>
