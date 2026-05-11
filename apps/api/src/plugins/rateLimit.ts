import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance, FastifyRequest } from 'fastify'

/**
 * Resolves the rate limit (requests per minute) for a given URL and HTTP method.
 *
 * Groups:
 *   POST /auth/login    →   5 req/min  (credential endpoint — most restrictive)
 *   POST /auth/refresh  →  10 req/min
 *   any  /auth/*        →  20 req/min
 *   any  /dashboard/*   → 100 req/min
 *   POST /upload        →  20 req/min
 *   default             →  60 req/min
 */
export function resolveLimit(url: string, method: string): number {
  const upperMethod = method.toUpperCase()

  if (upperMethod === 'POST' && url === '/auth/login') return 5
  if (upperMethod === 'POST' && url === '/auth/refresh') return 10
  if (url.startsWith('/auth/')) return 20
  if (url.startsWith('/dashboard/')) return 100
  if (url === '/upload') return 20

  return 60
}

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    timeWindow: '1 minute',
    max: (request: FastifyRequest) => resolveLimit(request.url, request.method),
    keyGenerator: (request: FastifyRequest) => {
      const url = request.url
      const method = request.method.toUpperCase()
      const ip = request.ip

      let group: string
      if (method === 'POST' && url === '/auth/login') {
        group = 'auth-login'
      } else if (method === 'POST' && url === '/auth/refresh') {
        group = 'auth-refresh'
      } else if (url.startsWith('/auth/')) {
        group = 'auth'
      } else if (url.startsWith('/dashboard/')) {
        group = 'dashboard'
      } else if (url === '/upload') {
        group = 'upload'
      } else {
        group = 'default'
      }

      return `${ip}:${group}`
    },
  })
})
