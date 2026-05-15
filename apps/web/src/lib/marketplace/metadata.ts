import type { Metadata } from 'next'

const SITE_NAME = 'Lonas SP - Toldos e Coberturas Sob Medida'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lonassp.com.br'

/**
 * Generates metadata for the marketplace home page.
 */
export function generateHomeMetadata(): Metadata {
  const title = `Marketplace | ${SITE_NAME}`
  const description =
    'Toldos, coberturas e lonas sob medida com qualidade premium. Solicite seu orçamento online.'

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical: `${BASE_URL}/marketplace`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/marketplace`,
      siteName: SITE_NAME,
      type: 'website',
    },
  }
}

/**
 * Generates metadata for a product detail page.
 */
export function generateProductMetadata(product: {
  title: string
  shortDescription?: string | null
  description?: string | null
  thumbnailUrl?: string | null
  slug: string
}): Metadata {
  const title = `${product.title} | ${SITE_NAME}`
  const description = buildDescription(
    product.shortDescription,
    product.description
  )
  const canonical = `${BASE_URL}/marketplace/product/${product.slug}`

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      ...(product.thumbnailUrl
        ? { images: [{ url: product.thumbnailUrl }] }
        : {}),
    },
  }
}

/**
 * Generates metadata for a category listing page.
 */
export function generateCategoryMetadata(category: {
  name: string
  slug: string
  description?: string | null
}): Metadata {
  const title = `${category.name} | ${SITE_NAME}`
  const description = buildDescription(
    category.description,
    `Produtos da categoria ${category.name}. Toldos, coberturas e lonas sob medida.`
  )
  const canonical = `${BASE_URL}/marketplace/category/${category.slug}`

  return {
    title,
    description,
    robots: 'index, follow',
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
    },
  }
}

/**
 * Builds a meta description from available text sources.
 * Uses shortDescription first, then truncates description, or falls back to generic text.
 */
function buildDescription(
  primary?: string | null,
  fallback?: string | null
): string {
  const DEFAULT_DESCRIPTION =
    'Toldos, coberturas e lonas sob medida com qualidade premium. Solicite seu orçamento online.'

  if (primary && primary.trim().length > 0) {
    return truncate(primary.trim())
  }

  if (fallback && fallback.trim().length > 0) {
    return truncate(fallback.trim())
  }

  return DEFAULT_DESCRIPTION
}

/**
 * Truncates text to a maximum of 160 characters for meta description.
 */
function truncate(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trimEnd() + '...'
}
