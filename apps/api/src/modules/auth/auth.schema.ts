import { z } from 'zod'

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().optional(),
})

export type LoginBody   = z.infer<typeof LoginSchema>
export type RefreshBody = z.infer<typeof RefreshSchema>
