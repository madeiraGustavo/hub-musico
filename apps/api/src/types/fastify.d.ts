import '@fastify/jwt'
import type { UserRole } from '@prisma/client'

export interface AuthContext {
  userId:   string
  artistId: string
  role:     UserRole
  siteId:   string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string; siteId: string }
    user:    AuthContext
  }
}
