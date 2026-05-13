'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiDelete, apiPatch } from '@/lib/api/client'
import { PaginationControls } from '@/components/marketplace/PaginationControls'

interface Product {
  id: string
  title: string
  slug: string
  type: string
  basePrice: number | null
  active: boolean
  featured: boolean
  stock: number | null
  sortOrder: number
  categoryId: string
  createdAt: string
}

interface Meta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  function loadProducts() {
    setLoading(true)
    apiGet<{ data: Product[]; meta: Meta }>(`/dashboard/marketplace/products?page=${page}&pageSize=20`)
      .then((res) => {
        setProducts(res.data)
        setMeta(res.meta)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [page])

  async function toggleActive(id: string, active: boolean) {
    try {
      await apiPatch(`/dashboard/marketplace/products/${id}`, { active: !active })
      loadProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      await apiDelete(`/dashboard/marketplace/products/${id}`)
      loadProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-default">Produtos</h1>
        <a
          href="/dashboard/marketplace/products/new"
          className="px-4 py-2 bg-bg-accent text-text-on-accent rounded text-sm"
        >
          Novo Produto
        </a>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-4 border border-border-default rounded-lg bg-bg-surface">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-text-default font-medium truncate">{product.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {product.active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-xs text-text-muted">
                  {product.type === 'FIXED_PRICE' ? `R$ ${product.basePrice}` : 'Orçamento'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button onClick={() => toggleActive(product.id, product.active)} className="text-xs text-text-muted hover:text-text-default">
                {product.active ? 'Desativar' : 'Ativar'}
              </button>
              <a href={`/dashboard/marketplace/products/${product.id}`} className="text-xs text-text-muted hover:text-text-default">
                Editar
              </a>
              <button onClick={() => handleDelete(product.id)} className="text-xs text-red-500 hover:text-red-700">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">Nenhum produto cadastrado.</p>
        )}
      </div>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  )
}
