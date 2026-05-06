import '@fastify/jwt'

export interface AuthContext {
  userId:   string
  artistId: string
  role:     'admin' | 'artist' | 'editor'
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string }
    user:    AuthContext
  }
}
