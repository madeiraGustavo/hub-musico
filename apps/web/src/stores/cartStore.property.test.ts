/**
 * cartStore.property.test.ts
 *
 * Property 11: Cart only accepts FIXED_PRICE products
 * Property 12: Cart quantity bounds respect stock
 * Property 13: Cart total equals sum of item subtotals
 *
 * Validates: Requirements 7.2, 7.3, 7.4, 7.6, 7.7
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useCartStore, type CartProduct } from './cartStore'

fc.configureGlobal({ numRuns: 200 })

function resetStore() {
  useCartStore.setState({ items: [] })
}

// ── Property 11: Cart only accepts FIXED_PRICE products ───────────────────────

describe('Property 11: Cart only accepts FIXED_PRICE products', () => {
  beforeEach(resetStore)

  it(
    'FIXED_PRICE with positive basePrice is accepted',
    () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 9999.99, noNaN: true }),
          (price) => {
            resetStore()
            const product: CartProduct = {
              id: 'prod-1',
              slug: 'test',
              title: 'Test',
              type: 'FIXED_PRICE',
              basePrice: price,
              stock: null,
              thumbnailUrl: null,
            }
            const result = useCartStore.getState().addItem(product)
            expect(result).toBe(true)
            expect(useCartStore.getState().items).toHaveLength(1)
          },
        ),
      )
    },
  )

  it(
    'QUOTE_ONLY is always rejected',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, 0, 100, 500),
          (price) => {
            resetStore()
            const product: CartProduct = {
              id: 'prod-1',
              slug: 'test',
              title: 'Test',
              type: 'QUOTE_ONLY',
              basePrice: price,
              stock: null,
              thumbnailUrl: null,
            }
            const result = useCartStore.getState().addItem(product)
            expect(result).toBe(false)
            expect(useCartStore.getState().items).toHaveLength(0)
          },
        ),
      )
    },
  )

  it(
    'FIXED_PRICE with zero or negative basePrice is rejected',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, 0, -1, -100),
          (price) => {
            resetStore()
            const product: CartProduct = {
              id: 'prod-1',
              slug: 'test',
              title: 'Test',
              type: 'FIXED_PRICE',
              basePrice: price,
              stock: null,
              thumbnailUrl: null,
            }
            const result = useCartStore.getState().addItem(product)
            expect(result).toBe(false)
            expect(useCartStore.getState().items).toHaveLength(0)
          },
        ),
      )
    },
  )
})

// ── Property 12: Cart quantity bounds respect stock ────────────────────────────

describe('Property 12: Cart quantity bounds respect stock', () => {
  beforeEach(resetStore)

  it(
    'quantity is clamped to [1, min(99, stock)] when stock is defined',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }),
          fc.integer({ min: -10, max: 200 }),
          (stock, requestedQty) => {
            resetStore()
            const product: CartProduct = {
              id: 'prod-1',
              slug: 'test',
              title: 'Test',
              type: 'FIXED_PRICE',
              basePrice: 100,
              stock,
              thumbnailUrl: null,
            }
            useCartStore.getState().addItem(product)
            useCartStore.getState().updateQuantity('prod-1', requestedQty)

            const item = useCartStore.getState().items[0]
            const maxQty = Math.min(99, stock)
            expect(item.quantity).toBeGreaterThanOrEqual(1)
            expect(item.quantity).toBeLessThanOrEqual(maxQty)
          },
        ),
      )
    },
  )

  it(
    'quantity is clamped to [1, 99] when stock is null',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 200 }),
          (requestedQty) => {
            resetStore()
            const product: CartProduct = {
              id: 'prod-1',
              slug: 'test',
              title: 'Test',
              type: 'FIXED_PRICE',
              basePrice: 100,
              stock: null,
              thumbnailUrl: null,
            }
            useCartStore.getState().addItem(product)
            useCartStore.getState().updateQuantity('prod-1', requestedQty)

            const item = useCartStore.getState().items[0]
            expect(item.quantity).toBeGreaterThanOrEqual(1)
            expect(item.quantity).toBeLessThanOrEqual(99)
          },
        ),
      )
    },
  )
})

// ── Property 13: Cart total equals sum of item subtotals ──────────────────────

describe('Property 13: Cart total equals sum of item subtotals', () => {
  beforeEach(resetStore)

  it(
    'total equals sum of quantity × unitPrice for all items',
    () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              price: fc.double({ min: 0.01, max: 999.99, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 99 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (productDefs) => {
            resetStore()

            // Add items
            for (const def of productDefs) {
              const product: CartProduct = {
                id: def.id,
                slug: `slug-${def.id}`,
                title: `Product ${def.id}`,
                type: 'FIXED_PRICE',
                basePrice: def.price,
                stock: null,
                thumbnailUrl: null,
              }
              useCartStore.getState().addItem(product)
              useCartStore.getState().updateQuantity(def.id, def.quantity)
            }

            const items = useCartStore.getState().items
            const computedTotal = useCartStore.getState().total()
            const expectedTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

            expect(computedTotal).toBeCloseTo(expectedTotal, 10)
          },
        ),
      )
    },
  )
})
