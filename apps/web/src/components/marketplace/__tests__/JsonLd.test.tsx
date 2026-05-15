import { describe, it, expect } from 'vitest'
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
} from '../JsonLd'

describe('JsonLd - buildProductJsonLd', () => {
  it('generates valid Product JSON-LD with all fields', () => {
    const result = buildProductJsonLd({
      name: 'Toldo Retrátil',
      description: 'Toldo retrátil de alta qualidade',
      image: 'https://example.com/toldo.jpg',
      price: 1500,
      currency: 'BRL',
      availability: 'InStock',
      brand: 'Lonas SP',
    })

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Toldo Retrátil',
      description: 'Toldo retrátil de alta qualidade',
      image: 'https://example.com/toldo.jpg',
      brand: { '@type': 'Brand', name: 'Lonas SP' },
      offers: {
        '@type': 'Offer',
        price: 1500,
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
      },
    })
  })

  it('omits image when not provided', () => {
    const result = buildProductJsonLd({
      name: 'Cobertura',
      description: 'Cobertura sob medida',
      availability: 'InStock',
      brand: 'Lonas SP',
    })

    expect(result).not.toHaveProperty('image')
  })

  it('omits price when not provided', () => {
    const result = buildProductJsonLd({
      name: 'Cobertura',
      description: 'Cobertura sob medida',
      availability: 'PreOrder',
      brand: 'Lonas SP',
    }) as Record<string, unknown>

    const offers = result.offers as Record<string, unknown>
    expect(offers).not.toHaveProperty('price')
    expect(offers.priceCurrency).toBe('BRL')
  })

  it('defaults currency to BRL when not specified', () => {
    const result = buildProductJsonLd({
      name: 'Toldo',
      description: 'Toldo fixo',
      price: 800,
      availability: 'InStock',
      brand: 'Lonas SP',
    }) as Record<string, unknown>

    const offers = result.offers as Record<string, unknown>
    expect(offers.priceCurrency).toBe('BRL')
  })

  it('maps OutOfStock availability correctly', () => {
    const result = buildProductJsonLd({
      name: 'Toldo',
      description: 'Toldo fixo',
      availability: 'OutOfStock',
      brand: 'Lonas SP',
    }) as Record<string, unknown>

    const offers = result.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('maps PreOrder availability correctly', () => {
    const result = buildProductJsonLd({
      name: 'Toldo',
      description: 'Toldo fixo',
      availability: 'PreOrder',
      brand: 'Lonas SP',
    }) as Record<string, unknown>

    const offers = result.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/PreOrder')
  })

  it('always produces valid JSON', () => {
    const result = buildProductJsonLd({
      name: 'Produto com "aspas" e <tags>',
      description: 'Descrição com caracteres especiais: \\ / \n \t',
      availability: 'InStock',
      brand: 'Marca & Cia',
    })

    const json = JSON.stringify(result)
    expect(() => JSON.parse(json)).not.toThrow()
  })
})

describe('JsonLd - buildBreadcrumbJsonLd', () => {
  it('generates valid BreadcrumbList with sequential positions', () => {
    const result = buildBreadcrumbJsonLd({
      items: [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Marketplace', url: 'https://example.com/marketplace' },
        { name: 'Toldos', url: 'https://example.com/marketplace/category/toldos' },
      ],
    })

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
        { '@type': 'ListItem', position: 2, name: 'Marketplace', item: 'https://example.com/marketplace' },
        { '@type': 'ListItem', position: 3, name: 'Toldos', item: 'https://example.com/marketplace/category/toldos' },
      ],
    })
  })

  it('handles a single breadcrumb item', () => {
    const result = buildBreadcrumbJsonLd({
      items: [{ name: 'Home', url: 'https://example.com' }],
    }) as Record<string, unknown>

    const elements = result.itemListElement as Array<Record<string, unknown>>
    expect(elements).toHaveLength(1)
    expect(elements[0]!.position).toBe(1)
  })

  it('handles empty items array', () => {
    const result = buildBreadcrumbJsonLd({ items: [] }) as Record<string, unknown>

    const elements = result.itemListElement as Array<Record<string, unknown>>
    expect(elements).toHaveLength(0)
  })

  it('always produces valid JSON', () => {
    const result = buildBreadcrumbJsonLd({
      items: [
        { name: 'Página "especial"', url: 'https://example.com/path?q=1&b=2' },
      ],
    })

    const json = JSON.stringify(result)
    expect(() => JSON.parse(json)).not.toThrow()
  })
})

describe('JsonLd - buildLocalBusinessJsonLd', () => {
  it('generates valid LocalBusiness JSON-LD', () => {
    const result = buildLocalBusinessJsonLd({
      name: 'Lonas SP',
      address: 'Rua das Lonas, 123 - São Paulo, SP',
      telephone: '(11) 99999-9999',
      openingHours: ['Mo-Fr 08:00-18:00', 'Sa 08:00-12:00'],
    })

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Lonas SP',
      address: 'Rua das Lonas, 123 - São Paulo, SP',
      telephone: '(11) 99999-9999',
      openingHoursSpecification: ['Mo-Fr 08:00-18:00', 'Sa 08:00-12:00'],
    })
  })

  it('handles empty openingHours array', () => {
    const result = buildLocalBusinessJsonLd({
      name: 'Lonas SP',
      address: 'Rua das Lonas, 123',
      telephone: '(11) 99999-9999',
      openingHours: [],
    }) as Record<string, unknown>

    expect(result.openingHoursSpecification).toEqual([])
  })

  it('always produces valid JSON', () => {
    const result = buildLocalBusinessJsonLd({
      name: 'Empresa "Teste" & Cia',
      address: 'Rua com <caracteres> especiais',
      telephone: '+55 (11) 99999-9999',
      openingHours: ['Mo-Su 00:00-23:59'],
    })

    const json = JSON.stringify(result)
    expect(() => JSON.parse(json)).not.toThrow()
  })
})
