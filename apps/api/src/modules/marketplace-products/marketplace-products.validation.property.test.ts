/**
 * marketplace-products.validation.property.test.ts
 *
 * Property 6: FIXED_PRICE requires positive basePrice
 * Property 7: HTML sanitization removes all tags
 *
 * Validates: Requirements 2.6, 2.8, 12.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateProductType, sanitizeText } from './marketplace-products.service.js'

fc.configureGlobal({ numRuns: 200 })

// ── Property 6: FIXED_PRICE requires positive basePrice ───────────────────────

describe('Property 6: FIXED_PRICE requires positive basePrice', () => {
  it(
    'FIXED_PRICE without basePrice returns error',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, null, 0, -1, -100),
          (basePrice) => {
            const error = validateProductType('FIXED_PRICE', basePrice as any)
            expect(error).not.toBeNull()
          },
        ),
      )
    },
  )

  it(
    'FIXED_PRICE with positive basePrice returns null (no error)',
    () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
          (basePrice) => {
            const error = validateProductType('FIXED_PRICE', basePrice)
            expect(error).toBeNull()
          },
        ),
      )
    },
  )

  it(
    'QUOTE_ONLY does not require basePrice',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, null, 0, -1, 100, 999),
          (basePrice) => {
            const error = validateProductType('QUOTE_ONLY', basePrice as any)
            expect(error).toBeNull()
          },
        ),
      )
    },
  )
})

// ── Property 7: HTML sanitization removes all tags ────────────────────────────

describe('Property 7: HTML sanitization removes all tags', () => {
  it(
    'sanitizeText: output contains no HTML tags',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (input) => {
            const result = sanitizeText(input)
            expect(result).not.toMatch(/<[^>]+>/)
          },
        ),
      )
    },
  )

  it(
    'sanitizeText: preserves non-tag text content',
    () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom('a', 'b', 'c', ' ', '1', '2', '.', ','), { minLength: 1, maxLength: 100 }),
          (plainText) => {
            // Wrap in tags and verify text is preserved
            const input = `<p>${plainText}</p>`
            const result = sanitizeText(input)
            expect(result).toBe(plainText)
          },
        ),
      )
    },
  )

  it(
    'sanitizeText: removes nested and multiple tags',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("xss")</script>',
            '<div><p>Hello</p></div>',
            '<b>bold</b> and <i>italic</i>',
            '<img src="x" onerror="alert(1)">text',
            '<<nested>>content</>',
          ),
          (input) => {
            const result = sanitizeText(input)
            expect(result).not.toMatch(/<[^>]+>/)
          },
        ),
      )
    },
  )
})
