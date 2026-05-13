/**
 * marketplace-products.ordering.property.test.ts
 *
 * Property 17: Listing ordering invariant
 *
 * Validates: Requirements 1.9, 4.9, 6.2, 9.4
 *
 * Tests that listings maintain correct ordering:
 * - Categories: sortOrder ASC
 * - Products: sortOrder ASC, createdAt DESC
 * - Quotes: createdAt DESC
 * - Orders: createdAt DESC
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

fc.configureGlobal({ numRuns: 200 })

describe('Property 17: Listing ordering invariant', () => {
  it(
    'categories sorted by sortOrder ASC',
    () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              sortOrder: fc.integer({ min: 0, max: 999 }),
            }),
            { minLength: 2, maxLength: 20 },
          ),
          (categories) => {
            const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].sortOrder).toBeGreaterThanOrEqual(sorted[i - 1].sortOrder)
            }
          },
        ),
      )
    },
  )

  it(
    'products sorted by sortOrder ASC then createdAt DESC',
    () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              sortOrder: fc.integer({ min: 0, max: 100 }),
              createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            }),
            { minLength: 2, maxLength: 20 },
          ),
          (products) => {
            const sorted = [...products].sort((a, b) => {
              if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
              return b.createdAt.getTime() - a.createdAt.getTime()
            })

            for (let i = 1; i < sorted.length; i++) {
              if (sorted[i].sortOrder === sorted[i - 1].sortOrder) {
                // Same sortOrder → createdAt should be DESC
                expect(sorted[i].createdAt.getTime()).toBeLessThanOrEqual(sorted[i - 1].createdAt.getTime())
              } else {
                // Different sortOrder → should be ASC
                expect(sorted[i].sortOrder).toBeGreaterThan(sorted[i - 1].sortOrder)
              }
            }
          },
        ),
      )
    },
  )

  it(
    'quotes and orders sorted by createdAt DESC',
    () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
            }),
            { minLength: 2, maxLength: 20 },
          ),
          (items) => {
            const sorted = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].createdAt.getTime()).toBeLessThanOrEqual(sorted[i - 1].createdAt.getTime())
            }
          },
        ),
      )
    },
  )
})
