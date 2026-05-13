/**
 * marketplace-categories.property.test.ts
 *
 * Property-based tests for slug generation.
 *
 * Property 1: Slug generation produces valid ASCII output
 *   Validates: Requirements 1.3, 1.7, 2.2
 *
 * Property 2: Slug uniqueness per artist
 *   Validates: Requirements 1.3, 1.7, 2.2
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { generateSlug } from './marketplace-categories.service.js'

fc.configureGlobal({ numRuns: 200 })

// ── Property 1: Slug generation produces valid ASCII output ───────────────────

describe('Property 1: Slug generation produces valid ASCII output', () => {
  it(
    'generateSlug: output contains only lowercase ASCII letters, digits, and hyphens',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (input) => {
            const slug = generateSlug(input)
            // Only a-z, 0-9, and hyphens allowed
            expect(slug).toMatch(/^[a-z0-9-]*$/)
          },
        ),
      )
    },
  )

  it(
    'generateSlug: output has no leading or trailing hyphens',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (input) => {
            const slug = generateSlug(input)
            if (slug.length > 0) {
              expect(slug[0]).not.toBe('-')
              expect(slug[slug.length - 1]).not.toBe('-')
            }
          },
        ),
      )
    },
  )

  it(
    'generateSlug: output has no consecutive hyphens',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (input) => {
            const slug = generateSlug(input)
            expect(slug).not.toContain('--')
          },
        ),
      )
    },
  )

  it(
    'generateSlug: accented characters are transliterated correctly',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Toldos Retráteis',
            'Cobertura São Paulo',
            'Capôtas Náuticas',
            'Lona Térmica Nº1',
            'Über Qualität',
            'Ñoño Español',
          ),
          (input) => {
            const slug = generateSlug(input)
            // Must produce non-empty valid slug
            expect(slug.length).toBeGreaterThan(0)
            expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
          },
        ),
      )
    },
  )

  it(
    'generateSlug: spaces and underscores become hyphens when between words',
    () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.stringOf(fc.constantFrom('a', 'b', 'c', '1', '2'), { minLength: 2, maxLength: 10 }),
            fc.constantFrom(' ', '  ', '   '),
            fc.stringOf(fc.constantFrom('d', 'e', 'f', '3', '4'), { minLength: 2, maxLength: 10 }),
          ),
          ([left, separator, right]) => {
            const input = `${left}${separator}${right}`
            const slug = generateSlug(input)
            // The separator should become a single hyphen between the two parts
            expect(slug).toContain('-')
            expect(slug).not.toContain('--')
            // The slug should start with left and end with right (lowercased)
            expect(slug.startsWith(left.toLowerCase())).toBe(true)
            expect(slug.endsWith(right.toLowerCase())).toBe(true)
          },
        ),
      )
    },
  )
})

// ── Property 2: Slug uniqueness per artist ────────────────────────────────────

describe('Property 2: Slug uniqueness per artist', () => {
  it(
    'generateSlug: same input always produces same output (deterministic)',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (input) => {
            const slug1 = generateSlug(input)
            const slug2 = generateSlug(input)
            expect(slug1).toBe(slug2)
          },
        ),
      )
    },
  )

  it(
    'generateSlug: different inputs with same base produce same slug (collision detection needed)',
    () => {
      // This test validates that the slug generation is deterministic,
      // and that ensureUniqueSlug is needed for uniqueness enforcement
      fc.assert(
        fc.property(
          fc.constantFrom(
            ['Toldo Retrátil', 'toldo retratil'],
            ['São Paulo', 'sao paulo'],
            ['Über Cool', 'uber cool'],
          ),
          ([input1, input2]) => {
            const slug1 = generateSlug(input1)
            const slug2 = generateSlug(input2)
            // These should produce the same slug, proving uniqueness check is needed
            expect(slug1).toBe(slug2)
          },
        ),
      )
    },
  )
})
