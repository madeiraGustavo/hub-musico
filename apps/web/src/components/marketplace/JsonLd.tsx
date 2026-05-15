// === Interfaces ===

export interface ProductJsonLdProps {
  name: string
  description: string
  image?: string
  price?: number
  currency?: string
  availability: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand: string
}

export interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export interface LocalBusinessJsonLdProps {
  name: string
  address: string
  telephone: string
  openingHours: string[]
}

// === Pure builder functions (exported for testability) ===

const AVAILABILITY_MAP: Record<ProductJsonLdProps['availability'], string> = {
  InStock: 'https://schema.org/InStock',
  OutOfStock: 'https://schema.org/OutOfStock',
  PreOrder: 'https://schema.org/PreOrder',
}

export function buildProductJsonLd(props: ProductJsonLdProps): object {
  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    availability: AVAILABILITY_MAP[props.availability],
    priceCurrency: props.currency ?? 'BRL',
  }

  if (props.price != null) {
    offers.price = props.price
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: props.description,
    brand: {
      '@type': 'Brand',
      name: props.brand,
    },
    offers,
  }

  if (props.image) {
    data.image = props.image
  }

  return data
}

export function buildBreadcrumbJsonLd(props: BreadcrumbJsonLdProps): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildLocalBusinessJsonLd(props: LocalBusinessJsonLdProps): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: props.name,
    address: props.address,
    telephone: props.telephone,
    openingHoursSpecification: props.openingHours,
  }
}

// === React Components ===

export function ProductJsonLd(props: ProductJsonLdProps) {
  const data = buildProductJsonLd(props)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BreadcrumbJsonLd(props: BreadcrumbJsonLdProps) {
  const data = buildBreadcrumbJsonLd(props)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function LocalBusinessJsonLd(props: LocalBusinessJsonLdProps) {
  const data = buildLocalBusinessJsonLd(props)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
