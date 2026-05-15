/**
 * Product filter utility for marketplace search.
 * Pure function — no side effects, easy to test with property-based testing.
 */

export interface FilterableProduct {
  id: string
  title: string
}

/**
 * Filters products by title using case-insensitive substring matching.
 *
 * - If query is empty or whitespace-only, returns all products unchanged.
 * - Otherwise, returns only products whose title contains the query
 *   as a case-insensitive substring.
 */
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  query: string
): T[] {
  const trimmed = query.trim()

  if (trimmed === '') {
    return products
  }

  const lowerQuery = trimmed.toLowerCase()

  return products.filter((product) =>
    product.title.toLowerCase().includes(lowerQuery)
  )
}
