'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { PaginationControls } from '@/components/marketplace/PaginationControls'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  price: number | null
  thumbnailUrl: string | null
  categoryId: string
  featured: boolean
  sortOrder: number
  createdAt: string
}

interface Meta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    // First get category by slug to get its ID, then fetch products
    fetch(`${API_URL}/marketplace/categories`)
      .then(r => r.json())
      .then((res) => {
        const category = res.data?.find((c: { slug: string }) => c.slug === slug)
        if (category) {
          return fetch(`${API_URL}/marketplace/products?categoryId=${category.id}&page=${page}&pageSize=20`)
            .then(r => r.json())
        }
        return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 1 } }
      })
      .then((res) => {
        setProducts(res.data ?? [])
        setMeta(res.meta ?? { total: 0, page: 1, pageSize: 20, totalPages: 1 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, page])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-default capitalize">{slug.replace(/-/g, ' ')}</h1>

      {products.length === 0 ? (
        <p className="text-text-muted py-12 text-center">
          Não há produtos disponíveis nesta categoria.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <PaginationControls
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
