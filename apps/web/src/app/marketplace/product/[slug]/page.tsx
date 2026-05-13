'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProductGallery } from '@/components/marketplace/ProductGallery'
import { QuoteModal } from '@/components/marketplace/QuoteModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface ProductImage {
  id: string
  url: string
  alt: string | null
  sortOrder: number
}

interface ProductDetail {
  id: string
  slug: string
  title: string
  description: string | null
  shortDescription: string | null
  type: 'FIXED_PRICE' | 'QUOTE_ONLY'
  basePrice: number | null
  customizable: boolean
  widthCm: number | null
  heightCm: number | null
  material: string | null
  color: string | null
  categoryId: string
  images: ProductImage[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [quoteOpen, setQuoteOpen] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/marketplace/products/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text-default">Produto não encontrado</h1>
        <a href="/marketplace" className="text-sm text-text-accent mt-2 inline-block">
          Voltar ao catálogo
        </a>
      </div>
    )
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Gallery */}
      <ProductGallery images={product.images} title={product.title} />

      {/* Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-default">{product.title}</h1>
          {product.shortDescription && (
            <p className="mt-2 text-text-muted">{product.shortDescription}</p>
          )}
        </div>

        {/* Price / Quote */}
        {product.type === 'FIXED_PRICE' && product.basePrice && (
          <div>
            <p className="text-2xl font-bold text-text-default">
              {formatPrice(product.basePrice)}
            </p>
            <button
              onClick={() => {
                // TODO: Add to cart (Task 14)
              }}
              className="mt-4 w-full px-6 py-3 bg-bg-accent text-text-on-accent rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        )}

        {product.type === 'QUOTE_ONLY' && (
          <div>
            <p className="text-sm text-text-muted">Preço sob consulta</p>
            <button
              onClick={() => setQuoteOpen(true)}
              className="mt-4 w-full px-6 py-3 bg-bg-accent text-text-on-accent rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Solicitar Orçamento
            </button>
          </div>
        )}

        {/* Specs */}
        <div className="border-t border-border-default pt-6 space-y-3">
          <h2 className="text-sm font-semibold text-text-default uppercase tracking-wide">
            Especificações
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {product.widthCm && (
              <>
                <dt className="text-text-muted">Largura</dt>
                <dd className="text-text-default">{product.widthCm} cm</dd>
              </>
            )}
            {product.heightCm && (
              <>
                <dt className="text-text-muted">Altura</dt>
                <dd className="text-text-default">{product.heightCm} cm</dd>
              </>
            )}
            {product.material && (
              <>
                <dt className="text-text-muted">Material</dt>
                <dd className="text-text-default">{product.material}</dd>
              </>
            )}
            {product.color && (
              <>
                <dt className="text-text-muted">Cor</dt>
                <dd className="text-text-default">{product.color}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Description */}
        {product.description && (
          <div className="border-t border-border-default pt-6">
            <h2 className="text-sm font-semibold text-text-default uppercase tracking-wide mb-3">
              Descrição
            </h2>
            <p className="text-text-muted text-sm whitespace-pre-line">{product.description}</p>
          </div>
        )}
      </div>

      {/* Quote Modal */}
      <QuoteModal
        productId={product.id}
        productTitle={product.title}
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
      />
    </div>
  )
}
