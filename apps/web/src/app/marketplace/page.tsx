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
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/marketplace/products?featured=true&pageSize=8`).then(r => r.json()),
      fetch(`${API_URL}/marketplace/products?pageSize=20`).then(r => r.json()),
      fetch(`${API_URL}/marketplace/categories`).then(r => r.json()),
    ])
      .then(([featuredRes, allRes, categoriesRes]) => {
        setFeaturedProducts(featuredRes.data ?? [])
        setAllProducts(allRes.data ?? [])
        setCategories(categoriesRes.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (activeCategory) {
      fetch(`${API_URL}/marketplace/products?categoryId=${activeCategory}&pageSize=20`)
        .then(r => r.json())
        .then(res => setAllProducts(res.data ?? []))
        .catch(() => {})
    }
  }, [activeCategory])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-400 text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80)' }}
        />
        <div className="relative text-center px-4">
          <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4">
            Catálogo Profissional
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            LONAS & COBERTURAS<br />SOB MEDIDA
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#catalogo"
              className="px-8 py-3 rounded-full border-2 border-white text-white font-medium hover:bg-white hover:text-gray-900 transition-colors"
            >
              Ver Catálogo
            </a>
            <a
              href="/marketplace/cart"
              className="px-8 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
            >
              Solicitar Orçamento
            </a>
          </div>
        </div>
      </section>

      {/* Categories + Products Section */}
      <section id="catalogo" className="py-16 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-10">
            <div className="mb-6 lg:mb-0">
              <h2 className="text-3xl font-bold text-gray-900">
                Encontre o produto certo
              </h2>
              <p className="text-gray-400 text-lg">para o seu próximo projeto</p>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveCategory(null)}
                className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                  !activeCategory ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-sm font-medium whitespace-nowrap pb-1 border-b-2 transition-colors ${
                    activeCategory === cat.id ? 'text-gray-900 border-gray-900' : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <a href="/marketplace/category/toldos" className="text-sm text-orange-500 font-medium whitespace-nowrap hover:text-orange-600">
                Ver todas categorias →
              </a>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeCategory ? allProducts : allProducts).map((product) => (
              <a
                key={product.id}
                href={`/marketplace/product/${product.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200 flex items-center justify-center">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-gray-300 text-6xl">📦</div>
                  )}
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                  {categories.find(c => c.id === product.categoryId)?.name ?? 'Produto'}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-1 group-hover:text-orange-500 transition-colors">
                  {product.title}
                </h3>
                {product.price !== null ? (
                  <p className="text-sm text-gray-600 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </p>
                ) : (
                  <p className="text-sm text-orange-500 mt-1 font-medium">Sob consulta</p>
                )}
              </a>
            ))}
          </div>

          {allProducts.length === 0 && (
            <p className="text-center text-gray-400 py-12">Nenhum produto encontrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
