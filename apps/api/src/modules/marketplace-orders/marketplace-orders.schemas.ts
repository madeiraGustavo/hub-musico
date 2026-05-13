import { z } from 'zod'

export const CreateOrderSchema = z.object({
  customerName:  z.string().min(1).max(100),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().max(20).optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity:  z.number().int().min(1).max(9999),
  })).min(1).max(50),
})

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

export const ListOrdersQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status:   z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
})

export type CreateOrderBody = z.infer<typeof CreateOrderSchema>
export type UpdateOrderStatusBody = z.infer<typeof UpdateOrderStatusSchema>
