/**
 * projects.controller.property.test.ts
 *
 * Property-based tests for:
 *   - Property 4: UpdateProjectSchema aceita válidos e rejeita inválidos
 *   - Property 6: DELETE com status 'active' ou 'archived' retorna 422
 *
 * Validates: Requirements 9.3, 9.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import type { FastifyRequest, FastifyReply } from 'fastify'

// ── Mock repository ───────────────────────────────────────────────────────────
vi.mock('./projects.repository.js', () => ({
  findAllByArtist: vi.fn(),
  findById:        vi.fn(),
  create:          vi.fn(),
  update:          vi.fn(),
  remove:          vi.fn(),
}))

// ── Mock env ──────────────────────────────────────────────────────────────────
vi.mock('../../env.js', () => ({
  env: {
    JWT_SECRET:         'test-jwt-secret-32-chars-minimum!!',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-32-chars!!',
    ALLOWED_ORIGINS:    'http://localhost:3000',
    STORAGE_BUCKET:     'test-bucket',
    PORT:               '3333',
  },
}))

import { UpdateProjectSchema } from './projects.schema.js'
import { deleteProjectHandler } from './projects.controller.js'
import { findById } from './projects.repository.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReply(): FastifyReply {
  const send = vi.fn().mockReturnThis()
  const code = vi.fn().mockReturnValue({ send })
  return { code, send } as unknown as FastifyReply
}

function makeRequest(
  user: { userId: string; artistId: string; role: 'admin' | 'artist' | 'editor' },
  params: { id: string },
  body: unknown = {},
): FastifyRequest<{ Params: { id: string } }> {
  return { user, params, body } as unknown as FastifyRequest<{ Params: { id: string } }>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_PLATFORMS = ['youtube', 'spotify', 'soundcloud', 'outro'] as const
type Platform = typeof VALID_PLATFORMS[number]

// ─── Generators ───────────────────────────────────────────────────────────────

/** Generates a valid partial project body (all fields optional, each valid when present). */
const validPartialProjectBody = fc.record(
  {
    title:               fc.string({ minLength: 2, maxLength: 100 }),
    description:         fc.string({ maxLength: 1000 }),
    year_label:          fc.string({ maxLength: 20 }),
    platform:            fc.constantFrom(...VALID_PLATFORMS),
    tags:                fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    href:                fc.webUrl(),
    thumbnail_url:       fc.webUrl(),
    spotify_id:          fc.string({ maxLength: 50 }),
    featured:            fc.boolean(),
    background_style:    fc.string({ maxLength: 200 }),
    background_position: fc.string({ maxLength: 50 }),
    background_size:     fc.string({ maxLength: 50 }),
    sort_order:          fc.integer({ min: 0, max: 9999 }),
  },
  { requiredKeys: [] }, // all fields optional — mirrors UpdateProjectSchema = CreateProjectSchema.partial()
)

/** Generates a string that is clearly not a URL (no protocol, no dots). */
const invalidUrl = fc.stringOf(
  fc.char().filter(c => c !== ':' && c !== '/' && c !== '.' && c !== '@'),
  { minLength: 1, maxLength: 50 },
)

/** Generates a string shorter than 2 characters (violates min(2)). */
const tooShortString = fc.oneof(fc.constant(''), fc.string({ maxLength: 1 }))

/** Generates a platform string that is NOT in the valid enum. */
const invalidPlatform = fc.string().filter(
  s => !(VALID_PLATFORMS as readonly string[]).includes(s),
)

/** Generates a sort_order that is negative (violates min(0)). */
const negativeSortOrder = fc.integer({ max: -1 })

// ─── Property 4: UpdateProjectSchema aceita válidos e rejeita inválidos ───────

/**
 * Property 4: UpdateProjectSchema aceita válidos e rejeita inválidos
 *
 * Para qualquer payload parcial com todos os campos dentro dos limites do schema,
 * UpdateProjectSchema.safeParse() deve retornar success: true.
 * Para payloads com campos inválidos (tipo errado, enum inválido, string fora dos
 * limites), deve retornar success: false.
 *
 * Validates: Requirements 9.3
 */
describe('Property 4: UpdateProjectSchema aceita válidos e rejeita inválidos', () => {
  // ── 4.1 Aceita payloads válidos ───────────────────────────────────────────

  it(
    'aceita qualquer payload parcial com campos válidos — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          validPartialProjectBody,
          async (body) => {
            const result = UpdateProjectSchema.safeParse(body)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'aceita payload vazio {} (todos os campos são opcionais) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant({}),
          async (body) => {
            const result = UpdateProjectSchema.safeParse(body)
            expect(result.success).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 4.2 Rejeita title inválido ────────────────────────────────────────────

  it(
    'rejeita title com menos de 2 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          tooShortString,
          async (title) => {
            const result = UpdateProjectSchema.safeParse({ title })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita title com mais de 100 caracteres quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 101, maxLength: 200 }),
          async (title) => {
            const result = UpdateProjectSchema.safeParse({ title })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 4.3 Rejeita platform inválida ─────────────────────────────────────────

  it(
    'rejeita platform fora do enum permitido quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidPlatform,
          async (platform) => {
            const result = UpdateProjectSchema.safeParse({ platform })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 4.4 Rejeita href inválida ─────────────────────────────────────────────

  it(
    'rejeita href que não é URL válida quando fornecida — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidUrl,
          async (href) => {
            const result = UpdateProjectSchema.safeParse({ href })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 4.5 Rejeita sort_order negativo ──────────────────────────────────────

  it(
    'rejeita sort_order negativo quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          negativeSortOrder,
          async (sort_order) => {
            const result = UpdateProjectSchema.safeParse({ sort_order })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── 4.6 Rejeita tipos errados ─────────────────────────────────────────────

  it(
    'rejeita title como não-string quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null)),
          async (title) => {
            const result = UpdateProjectSchema.safeParse({ title })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita featured como não-boolean quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.string(), fc.integer(), fc.constant(null)),
          async (featured) => {
            const result = UpdateProjectSchema.safeParse({ featured })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'rejeita tags como não-array quando fornecido — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
          async (tags) => {
            const result = UpdateProjectSchema.safeParse({ tags })
            expect(result.success).toBe(false)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─── Property 6: DELETE com status 'active' ou 'archived' retorna 422 ─────────

/**
 * Property 6: DELETE com status 'active' ou 'archived' retorna 422
 *
 * Para qualquer projeto com status diferente de 'draft', o deleteProjectHandler
 * deve retornar HTTP 422 com a mensagem de erro correta — nunca 204.
 *
 * Validates: Requirements 9.8
 */
describe('Property 6: DELETE com status não-draft retorna 422', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'retorna 422 para qualquer projeto com status "active" — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // projectId
          fc.uuid(), // artistId
          async (projectId, artistId) => {
            vi.resetAllMocks()

            vi.mocked(findById).mockResolvedValue({
              id:       projectId,
              artistId: artistId,
              status:   'active',
            } as unknown as Awaited<ReturnType<typeof findById>>)

            const request = makeRequest(
              { userId: artistId, artistId, role: 'artist' },
              { id: projectId },
            )
            const reply = makeReply()

            await deleteProjectHandler(request, reply)

            expect(reply.code).toHaveBeenCalledWith(422)
            expect(
              (reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send,
            ).toHaveBeenCalledWith({ error: 'Apenas projetos em rascunho podem ser removidos' })

            // Nunca deve retornar 204
            expect(reply.code).not.toHaveBeenCalledWith(204)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'retorna 422 para qualquer projeto com status "archived" — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // projectId
          fc.uuid(), // artistId
          async (projectId, artistId) => {
            vi.resetAllMocks()

            vi.mocked(findById).mockResolvedValue({
              id:       projectId,
              artistId: artistId,
              status:   'archived',
            } as unknown as Awaited<ReturnType<typeof findById>>)

            const request = makeRequest(
              { userId: artistId, artistId, role: 'artist' },
              { id: projectId },
            )
            const reply = makeReply()

            await deleteProjectHandler(request, reply)

            expect(reply.code).toHaveBeenCalledWith(422)
            expect(
              (reply.code(422) as unknown as { send: ReturnType<typeof vi.fn> }).send,
            ).toHaveBeenCalledWith({ error: 'Apenas projetos em rascunho podem ser removidos' })

            // Nunca deve retornar 204
            expect(reply.code).not.toHaveBeenCalledWith(204)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'retorna 422 para qualquer status diferente de "draft" (active ou archived) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // projectId
          fc.uuid(), // artistId
          fc.constantFrom('active', 'archived'), // status não-draft
          async (projectId, artistId, status) => {
            vi.resetAllMocks()

            vi.mocked(findById).mockResolvedValue({
              id:       projectId,
              artistId: artistId,
              status,
            } as unknown as Awaited<ReturnType<typeof findById>>)

            const request = makeRequest(
              { userId: artistId, artistId, role: 'artist' },
              { id: projectId },
            )
            const reply = makeReply()

            await deleteProjectHandler(request, reply)

            // Invariante: status não-draft sempre resulta em 422
            expect(reply.code).toHaveBeenCalledWith(422)
            expect(reply.code).not.toHaveBeenCalledWith(204)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'retorna 204 para projeto com status "draft" (caminho feliz) — mínimo 100 iterações',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // projectId
          fc.uuid(), // artistId
          async (projectId, artistId) => {
            vi.resetAllMocks()

            vi.mocked(findById).mockResolvedValue({
              id:       projectId,
              artistId: artistId,
              status:   'draft',
            } as unknown as Awaited<ReturnType<typeof findById>>)

            const request = makeRequest(
              { userId: artistId, artistId, role: 'artist' },
              { id: projectId },
            )
            const reply = makeReply()

            await deleteProjectHandler(request, reply)

            // Projeto em draft deve ser removido com sucesso
            expect(reply.code).toHaveBeenCalledWith(204)
            expect(reply.code).not.toHaveBeenCalledWith(422)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
