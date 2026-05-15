import type { MetadataRoute } from 'next'
import { fetchProducts, fetchCategories } from '@/lib/marketplace/api'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lonassp.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsRes, categories] = await Promise.all([
    fetchProducts({ pageSize: 50 }),
    fetchCategories(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/marketplace/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const productPages: MetadataRoute.Sitemap = productsRes.data.map((product) => ({
    url: `${BASE_URL}/marketplace/product/${product.slug}`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
