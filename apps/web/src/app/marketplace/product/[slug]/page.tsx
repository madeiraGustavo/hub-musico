import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchProduct, fetchCategories } from '@/lib/marketplace/api'
import { generateProductMetadata } from '@/lib/marketplace/metadata'
import { Breadcrumb } from '@/components/marketplace/Breadcrumb'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/marketplace/JsonLd'
import { ProductDetailClient } from './ProductDetailClient'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await fetchProduct(params.slug)
  if (!product) {
    return { title: 'Produto não encontrado | Lonas SP' }
  }
  return generateProductMetadata({
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    thumbnailUrl: product.thumbnailUrl,
    slug: product.slug,
  })
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await fetchProduct(params.slug)

  if (!product) {
    notFound()
  }

  const breadcrumbItems = [
    { label: 'Marketplace', href: '/marketplace' },
    ...(product.category
      ? [{ label: product.category.name, href: `/marketplace/category/${product.category.slug}` }]
      : []),
    { label: product.title },
  ]

  return (
    <>
      {/* Structured Data */}
      <ProductJsonLd
        name={product.title}
        description={product.description ?? product.shortDescription ?? product.title}
        image={product.images?.[0]?.url}
        price={product.basePrice ?? undefined}
        availability={product.stock === 0 ? 'OutOfStock' : 'InStock'}
        brand="Lonas SP"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Marketplace', url: 'https://lonassp.com.br/marketplace' },
          ...(product.category
            ? [{ name: product.category.name, url: `https://lonassp.com.br/marketplace/category/${product.category.slug}` }]
            : []),
          { name: product.title, url: `https://lonassp.com.br/marketplace/product/${product.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Product Detail (Client Component for interactivity) */}
      <ProductDetailClient product={product} />
    </>
  )
}
