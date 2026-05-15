'use client'

import { useState, useCallback } from 'react'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { filterProducts } from '@/lib/marketplace/filterProducts'
import type { Product } from '@/lib/marketplace/api'

interface CatalogSectionProps {
  initialProducts: Product[]
  categories: Array<{ id: string; name: string; slug: string }>
}

export function CatalogSection({ initialProducts, categories }: CatalogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setActiveCategory(categoryId)
  }, [])

  // Filter products by category first, then by search query
  let filtered = initialProducts
  if (activeCategory) {
    filtered = filtered.filter((p) => p.categoryId === activeCategory)
  }
  if (searchQuery.trim()) {
    filtered = filterProducts(filtered, searchQuery)
  }

  return (
    <>
      {/* Search + Category Filter */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Buscar produtos por nome..."
          categories={categories}
          onCategorySelect={handleCategorySelect}
        />
      </div>

      {/* Product Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const category = categories.find((c) => c.id === product.categoryId)
            return (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  description: product.description,
                  type: product.type,
                  basePrice: product.basePrice,
                  thumbnailUrl: product.thumbnailUrl,
                  category: category ? { name: category.name, slug: category.slug } : undefined,
                  widthCm: product.widthCm,
                  heightCm: product.heightCm,
                  material: product.material,
                }}
              />
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon="search"
          title="Nenhum produto encontrado"
          description="Tente buscar por outro termo ou explore outras categorias."
          action={{ label: 'Ver todos os produtos', href: '/marketplace' }}
        />
      )}
    </>
  )
}
