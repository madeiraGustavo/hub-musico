import { describe, it, expect } from 'vitest'
import { filterProducts, FilterableProduct } from '../filterProducts'

describe('filterProducts', () => {
  const products: FilterableProduct[] = [
    { id: '1', title: 'Toldo Retrátil Premium' },
    { id: '2', title: 'Cobertura de Policarbonato' },
    { id: '3', title: 'Lona para Caminhão' },
    { id: '4', title: 'Toldo Articulado' },
  ]

  it('returns all products when query is empty', () => {
    expect(filterProducts(products, '')).toEqual(products)
  })

  it('returns all products when query is whitespace-only', () => {
    expect(filterProducts(products, '   ')).toEqual(products)
  })

  it('filters products by case-insensitive title match', () => {
    const result = filterProducts(products, 'toldo')
    expect(result).toHaveLength(2)
    expect(result[0]!.title).toBe('Toldo Retrátil Premium')
    expect(result[1]!.title).toBe('Toldo Articulado')
  })

  it('is case-insensitive (uppercase query)', () => {
    const result = filterProducts(products, 'LONA')
    expect(result).toHaveLength(1)
    expect(result[0]!.title).toBe('Lona para Caminhão')
  })

  it('returns empty array when no products match', () => {
    expect(filterProducts(products, 'inexistente')).toEqual([])
  })

  it('preserves original array order', () => {
    const result = filterProducts(products, 'toldo')
    expect(result[0]!.title).toBe('Toldo Retrátil Premium')
    expect(result[1]!.title).toBe('Toldo Articulado')
  })

  it('preserves generic type (extra properties)', () => {
    const typed = [
      { id: '1', title: 'Toldo A', price: 100 },
      { id: '2', title: 'Lona B', price: 200 },
    ]
    const result = filterProducts(typed, 'toldo')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: '1', title: 'Toldo A', price: 100 })
  })

  it('handles empty product array', () => {
    expect(filterProducts([], 'test')).toEqual([])
  })

  it('trims query before matching', () => {
    const result = filterProducts(products, '  toldo  ')
    expect(result).toHaveLength(2)
  })
})
