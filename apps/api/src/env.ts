import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ALLOWED_ORIGINS: z.string().min(1),
  STORAGE_BUCKET: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
})

const result = EnvSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(result.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = result.data
