/**
 * marketplace-quotes.property.test.ts
 *
 * Property 9: Quote status transition validity
 *
 * Validates: Requirements 6.5, 6.6, 6.7
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateQuoteStatusTransition } from './marketplace-quotes.service.js'

fc.configureGlobal({ numRuns: 200 })

const ALL_STATUSES = ['PENDING', 'ANSWERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const

const VALID_TRANSITIONS: [string, string][] = [
  ['PENDING', 'ANSWERED'],
  ['PENDING', 'REJECTED'],
  ['PENDING', 'EXPIRED'],
  ['ANSWERED', 'ACCEPTED'],
  ['ANSWERED', 'REJECTED'],
]

describe('Property 9: Quote status transition validity', () => {
  it(
    'valid transitions are accepted',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_TRANSITIONS),
          ([current, next]) => {
            expect(validateQuoteStatusTransition(current, next)).toBe(true)
          },
        ),
      )
    },
  )

  it(
    'invalid transitions are rejected',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATUSES),
          fc.constantFrom(...ALL_STATUSES),
          (current, next) => {
            const isValid = VALID_TRANSITIONS.some(([c, n]) => c === current && n === next)
            if (!isValid) {
              expect(validateQuoteStatusTransition(current, next)).toBe(false)
            }
          },
        ),
      )
    },
  )

  it(
    'terminal states (ACCEPTED, REJECTED, EXPIRED) cannot transition to anything',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ACCEPTED', 'REJECTED', 'EXPIRED'),
          fc.constantFrom(...ALL_STATUSES),
          (current, next) => {
            expect(validateQuoteStatusTransition(current, next)).toBe(false)
          },
        ),
      )
    },
  )
})
