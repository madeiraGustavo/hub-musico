import { describe, it, expect } from 'vitest'
import {
  generateHomeMetadata,
  generateProductMetadata,
  generateCategoryMetadata,
} from '../metadata'

const SITE_NAME = 'Lonas SP - Toldos e Coberturas Sob Medida'

describe('generateHomeMetadata', () => {
  it('returns title with Marketplace prefix and site name', () => {
    const meta = generateHomeMetadata()
    expect(meta.title).toBe(`Marketplace | ${SITE_NAME}`)
  })

  it('includes non-empty description', () => {
    const meta = generateHomeMetadata()
    expect(meta.description).toBeTruthy()
    expect((meta.description as string).length).toBeGreaterThan(0)
  })

  it('sets robots to index, follow', () => {
    const meta = generateHomeMetadata()
    expect(meta.robots).toBe('index, follow')
  })

  it('includes canonical URL for /marketplace', () => {
    const meta = generateHomeMetadata()
    expect(meta.alternates?.canonical).toContain('/marketplace')
  })

  it('includes og:title and og:description', () => {
    const meta = generateHomeMetadata()
    const og = meta.openGraph as Record<string, unknown>
    expect(og.title).toBe(meta.title)
    expect(og.description).toBe(meta.description)
  })
})

describe('generateProductMetadata', () => {
  const product = {
    title: 'Toldo Retrátil Premium',
    shortDescription: 'Toldo retrátil de alta qualidade para áreas externas.',
    description: 'Descrição longa do produto com muitos detalhes sobre materiais e instalação.',
    thumbnailUrl: 'https://example.com/image.jpg',
    slug: 'toldo-retratil-premium',
  }

  it('follows title pattern: "{Name} | Site Name"', () => {
    const meta = generateProductMetadata(product)
    expect(meta.title).toBe(`${product.title} | ${SITE_NAME}`)
  })

  it('uses shortDescription as meta description when available', () => {
    const meta = generateProductMetadata(product)
    expect(meta.description).toBe(product.shortDescription)
  })

  it('falls back to truncated description when shortDescription is null', () => {
    const meta = generateProductMetadata({
      ...product,
      shortDescription: null,
    })
    expect(meta.description).toBe(product.description)
  })

  it('falls back to generic text when no descriptions available', () => {
    const meta = generateProductMetadata({
      ...product,
      shortDescription: null,
      description: null,
    })
    expect(meta.description).toBeTruthy()
    expect((meta.description as string).length).toBeGreaterThan(0)
  })

  it('truncates description to 160 chars max', () => {
    const longDesc = 'A'.repeat(200)
    const meta = generateProductMetadata({
      ...product,
      shortDescription: null,
      description: longDesc,
    })
    expect((meta.description as string).length).toBeLessThanOrEqual(160)
    expect((meta.description as string).endsWith('...')).toBe(true)
  })

  it('sets robots to index, follow', () => {
    const meta = generateProductMetadata(product)
    expect(meta.robots).toBe('index, follow')
  })

  it('includes canonical URL with product slug', () => {
    const meta = generateProductMetadata(product)
    expect(meta.alternates?.canonical).toContain(
      `/marketplace/product/${product.slug}`
    )
  })

  it('includes og:image when thumbnailUrl is provided', () => {
    const meta = generateProductMetadata(product)
    const og = meta.openGraph as Record<string, unknown>
    expect(og.images).toEqual([{ url: product.thumbnailUrl }])
  })

  it('omits og:image when thumbnailUrl is null', () => {
    const meta = generateProductMetadata({ ...product, thumbnailUrl: null })
    const og = meta.openGraph as Record<string, unknown>
    expect(og.images).toBeUndefined()
  })

  it('og:title and og:description match title and description', () => {
    const meta = generateProductMetadata(product)
    const og = meta.openGraph as Record<string, unknown>
    expect(og.title).toBe(meta.title)
    expect(og.description).toBe(meta.description)
  })
})

describe('generateCategoryMetadata', () => {
  const category = {
    name: 'Toldos',
    slug: 'toldos',
    description: 'Toldos de alta qualidade para residências e comércios.',
  }

  it('follows title pattern: "{Name} | Site Name"', () => {
    const meta = generateCategoryMetadata(category)
    expect(meta.title).toBe(`${category.name} | ${SITE_NAME}`)
  })

  it('uses category description when available', () => {
    const meta = generateCategoryMetadata(category)
    expect(meta.description).toBe(category.description)
  })

  it('falls back to generic description when category description is null', () => {
    const meta = generateCategoryMetadata({ ...category, description: null })
    expect(meta.description).toBeTruthy()
    expect((meta.description as string).length).toBeGreaterThan(0)
  })

  it('sets robots to index, follow', () => {
    const meta = generateCategoryMetadata(category)
    expect(meta.robots).toBe('index, follow')
  })

  it('includes canonical URL with category slug', () => {
    const meta = generateCategoryMetadata(category)
    expect(meta.alternates?.canonical).toContain(
      `/marketplace/category/${category.slug}`
    )
  })

  it('og:title and og:description match title and description', () => {
    const meta = generateCategoryMetadata(category)
    const og = meta.openGraph as Record<string, unknown>
    expect(og.title).toBe(meta.title)
    expect(og.description).toBe(meta.description)
  })
})
