/**
 * rateLimit.property.test.ts
 *
 * Property-based tests for the `resolveLimit` function in rateLimit.ts
 *
 * Property 2: Mapeamento correto de rate limit por grupo de rotas e método
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { resolveLimit } from './rateLimit.js'

// ── Mandatory explicit cases ──────────────────────────────────────────────────

describe('resolveLimit — casos obrigatórios explícitos', () => {
  it('POST /auth/login → 5', () => {
    expect(resolveLimit('/auth/login', 'POST')).toBe(5)
  })

  it('POST /auth/refresh → 10', () => {
    expect(resolveLimit('/auth/refresh', 'POST')).toBe(10)
  })

  it('GET /auth/session → 20', () => {
    expect(resolveLimit('/auth/session', 'GET')).toBe(20)
  })

  it('GET /dashboard/tracks → 100', () => {
    expect(resolveLimit('/dashboard/tracks', 'GET')).toBe(100)
  })

  it('POST /upload → 20', () => {
    expect(resolveLimit('/upload', 'POST')).toBe(20)
  })
})

// ── Property 2: Mapeamento correto de rate limit por grupo de rotas e método ──
//
// Para qualquer URL de requisição, `resolveLimit(url, method)` deve retornar
// exatamente o limite configurado para o grupo ao qual a URL pertence:
//   POST /auth/login    →   5 req/min
//   POST /auth/refresh  →  10 req/min
//   any  /auth/*        →  20 req/min
//   any  /dashboard/*   → 100 req/min
//   POST /upload        →  20 req/min
//   default             →  60 req/min
//
// Validates: Requirements 4.1, 4.2, 4.3, 4.4

describe('Property 2: Mapeamento correto de rate limit por grupo de rotas e método', () => {
  // Arbitrary: random path segment (alphanumeric, no leading slash)
  const pathSegment = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/)

  // Arbitrary: any HTTP method
  const httpMethod = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS')

  it(
    'POST /auth/login retorna sempre 5, independente de maiúsculas/minúsculas no método',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom('POST', 'post', 'Post'),
          (method) => {
            expect(resolveLimit('/auth/login', method)).toBe(5)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'POST /auth/refresh retorna sempre 10, independente de maiúsculas/minúsculas no método',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom('POST', 'post', 'Post'),
          (method) => {
            expect(resolveLimit('/auth/refresh', method)).toBe(10)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'qualquer URL /auth/* (exceto /auth/login com POST e /auth/refresh com POST) retorna 20',
    () => {
      fc.assert(
        fc.property(
          pathSegment,
          httpMethod,
          (segment, method) => {
            const url = `/auth/${segment}`

            // Skip the two special cases handled by more specific rules
            if (method.toUpperCase() === 'POST' && url === '/auth/login') return
            if (method.toUpperCase() === 'POST' && url === '/auth/refresh') return

            expect(resolveLimit(url, method)).toBe(20)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'qualquer URL /dashboard/* retorna 100 para qualquer método',
    () => {
      fc.assert(
        fc.property(
          pathSegment,
          httpMethod,
          (segment, method) => {
            const url = `/dashboard/${segment}`
            expect(resolveLimit(url, method)).toBe(100)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    '/upload retorna 20 para qualquer método',
    () => {
      fc.assert(
        fc.property(
          httpMethod,
          (method) => {
            expect(resolveLimit('/upload', method)).toBe(20)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'URLs que não pertencem a nenhum grupo retornam 60',
    () => {
      // Generate URLs that do NOT start with /auth/, /dashboard/, or equal /upload
      const nonMatchingUrl = pathSegment.map((seg) => `/${seg}`).filter(
        (url) => !url.startsWith('/auth/') && !url.startsWith('/dashboard/') && url !== '/upload',
      )

      fc.assert(
        fc.property(
          nonMatchingUrl,
          httpMethod,
          (url, method) => {
            expect(resolveLimit(url, method)).toBe(60)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'para qualquer combinação de URL e método, resolveLimit retorna um dos valores permitidos: 5, 10, 20, 60, 100',
    () => {
      const allowedLimits = new Set([5, 10, 20, 60, 100])

      fc.assert(
        fc.property(
          fc.webPath(),
          httpMethod,
          (url, method) => {
            const limit = resolveLimit(url, method)
            expect(allowedLimits.has(limit)).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
