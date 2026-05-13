'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { CategoryNav } from '@/components/marketplace/CategoryNav'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  categoryId: string
  featured: boolean
  sortOrder: number
  thumbnailUrl: string | null
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  sortOrder: number
}

export default function MarketplacePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/marketplace/products?featured=true&pageSize=8`).then(r => r.json()),
      fetch(`${API_URL}/marketplace/categories`).then(r => r.json()),
    ])
      .then(([productsRes, categoriesRes]) => {
        setFeaturedProducts(productsRes.data ?? [])
        setCategories(categoriesRes.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-default mb-4">
          Lonas & Coberturas
        </h1>
        <p className="text-text-muted max-w-2xl mx-auto">
          Toldos, capotas, coberturas e lonas industriais sob medida. Produtos com preço fixo ou orçamento personalizado.
        </p>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-text-default mb-4">Categorias</h2>
          <CategoryNav categories={categories} />
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-text-default mb-4">Destaques</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
