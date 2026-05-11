/**
 * profile.repository.property.test.ts
 *
 * Property-based tests for profile.repository.ts
 *
 * Property 7: Completude dos campos retornados pelo profile update
 * Validates: Requirements 12.1, 12.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// ── Mock Prisma before importing the repository ───────────────────────────────
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    artist: {
      update: vi.fn(),
    },
  },
}))

import { update } from './profile.repository.js'
import { prisma } from '../../lib/prisma.js'

// ── The 13 expected fields returned by profile.repository.update ──────────────
const EXPECTED_FIELDS = [
  'id',
  'name',
  'slug',
  'tagline',
  'bio',
  'location',
  'reach',
  'email',
  'whatsapp',
  'skills',
  'tools',
  'isActive',
  'updatedAt',
] as const

// ── Property 7: Completude dos campos retornados pelo profile update ───────────
//
// Para qualquer artistId e qualquer body de update válido, a resposta de
// `update(artistId, data)` deve conter todos os 13 campos esperados:
// id, name, slug, tagline, bio, location, reach, email, whatsapp,
// skills, tools, isActive, updatedAt.
//
// Validates: Requirements 12.1, 12.2

describe('Property 7: Completude dos campos retornados pelo profile update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(
    'para qualquer artistId e dados de update, a resposta contém todos os 13 campos esperados',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            artistId: fc.uuid(),
            name:     fc.option(fc.string({ minLength: 2, maxLength: 100 }), { nil: undefined }),
            tagline:  fc.option(fc.string({ maxLength: 300 }), { nil: undefined }),
            bio:      fc.option(fc.array(fc.string({ maxLength: 1000 }), { maxLength: 5 }), { nil: undefined }),
            location: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
            reach:    fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
            email:    fc.option(fc.emailAddress(), { nil: undefined }),
            whatsapp: fc.option(fc.string({ maxLength: 20 }), { nil: undefined }),
            skills:   fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 20 }), { nil: undefined }),
            tools:    fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 20 }), { nil: undefined }),
          }),
          async ({ artistId, ...data }) => {
            vi.resetAllMocks()

            // ── Arrange: mock Prisma to return an artist object with all 13 fields ──

            const mockArtist = {
              id:        artistId,
              name:      data.name ?? 'Mock Artist',
              slug:      `mock-artist-${artistId.slice(0, 8)}`,
              tagline:   data.tagline ?? 'Mock tagline',
              bio:       data.bio ?? ['Mock bio paragraph'],
              location:  data.location ?? 'Mock City',
              reach:     data.reach ?? 'local',
              email:     data.email ?? `mock-${artistId.slice(0, 8)}@example.com`,
              whatsapp:  data.whatsapp ?? '+5511999999999',
              skills:    data.skills ?? ['skill1'],
              tools:     data.tools ?? ['tool1'],
              isActive:  true,
              updatedAt: new Date(),
            }

            vi.mocked(prisma.artist.update).mockResolvedValue(mockArtist as any)

            // ── Act ───────────────────────────────────────────────────────────

            // Filter out undefined values to simulate a real partial update body
            const updateData = Object.fromEntries(
              Object.entries(data).filter(([, v]) => v !== undefined),
            )

            const result = await update(artistId, updateData)

            // ── Assert: all 13 expected fields are present in the response ────

            for (const field of EXPECTED_FIELDS) {
              expect(result, `campo "${field}" deve estar presente na resposta`).toHaveProperty(field)
            }

            // ── Assert: prisma.artist.update was called with the correct artistId ──

            expect(prisma.artist.update).toHaveBeenCalledOnce()
            expect(prisma.artist.update).toHaveBeenCalledWith(
              expect.objectContaining({
                where: { id: artistId },
              }),
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    'para qualquer artistId, a resposta não contém campos extras além dos 13 esperados',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (artistId) => {
            vi.resetAllMocks()

            // ── Arrange ───────────────────────────────────────────────────────

            const mockArtist = {
              id:        artistId,
              name:      'Mock Artist',
              slug:      `mock-${artistId.slice(0, 8)}`,
              tagline:   'Mock tagline',
              bio:       ['Mock bio'],
              location:  'Mock City',
              reach:     'local',
              email:     `mock@example.com`,
              whatsapp:  '+5511999999999',
              skills:    ['skill1'],
              tools:     ['tool1'],
              isActive:  true,
              updatedAt: new Date(),
            }

            vi.mocked(prisma.artist.update).mockResolvedValue(mockArtist as any)

            // ── Act ───────────────────────────────────────────────────────────

            const result = await update(artistId, { name: 'Updated Name' })

            // ── Assert: all 13 fields are present ────────────────────────────

            expect(Object.keys(result as object)).toHaveLength(EXPECTED_FIELDS.length)

            for (const field of EXPECTED_FIELDS) {
              expect(result).toHaveProperty(field)
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
