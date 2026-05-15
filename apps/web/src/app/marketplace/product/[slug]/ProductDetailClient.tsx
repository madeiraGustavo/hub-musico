'use client'

import { useState } from 'react'
import { ProductGallery } from '@/components/marketplace/ProductGallery'
import { QuoteModal } from '@/components/marketplace/QuoteModal'
import { useCartStore } from '@/stores/cartStore'
import { useToastStore } from '@/stores/toastStore'
import type { ProductDetail } from '@/lib/marketplace/api'

interface ProductDetailClientProps {
  product: ProductDetail
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

function WidthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2 9h14M2 9l2-2M2 9l2 2M16 9l-2-2M16 9l-2 2" />
    </svg>
  )
}

function HeightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M9 2v14M9 2l-2 2M9 2l2 2M9 16l-2-2M9 16l2-2" />
    </svg>
  )
}

function MaterialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <path d="M3 7h12M7 3v12" opacity="0.5" />
    </svg>
  )
}

function ColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <circle cx="9" cy="9" r="3" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const addToast = useToastStore((s) => s.addToast)

  function handleAddToCart() {
    if (product.type !== 'FIXED_PRICE' || !product.basePrice) return

    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      type: product.type,
      basePrice: product.basePrice,
      stock: product.stock ?? null,
      thumbnailUrl: product.thumbnailUrl,
    })

    addToast({
      type: 'success',
      message: `"${product.title}" adicionado ao carrinho`,
    })
  }

  const specs = [
    product.widthCm ? { icon: <WidthIcon />, label: 'Largura', value: `${product.widthCm} cm` } : null,
    product.heightCm ? { icon: <HeightIcon />, label: 'Altura', value: `${product.heightCm} cm` } : null,
    product.material ? { icon: <MaterialIcon />, label: 'Material', value: product.material } : null,
    product.color ? { icon: <ColorIcon />, label: 'Cor', value: product.color } : null,
  ].filter(Boolean)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
      {/* Gallery */}
      <ProductGallery images={product.images} title={product.title} />

      {/* Details */}
      <div className="space-y-6">
        <div>
          <h1 className="mp-heading-2">{product.title}</h1>
          {product.shortDescription && (
            <p className="mt-3" style={{ color: 'var(--mp-text-secondary)', lineHeight: '1.6' }}>
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Price / Quote */}
        {product.type === 'FIXED_PRICE' && product.basePrice && (
          <div>
            <p className="text-3xl font-bold" style={{ color: 'var(--mp-text-default)', fontFamily: 'var(--mp-font-heading)' }}>
              {formatPrice(product.basePrice)}
            </p>
            <button
              onClick={handleAddToCart}
              className="mp-btn-primary w-full mt-4"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        )}

        {product.type === 'QUOTE_ONLY' && (
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--mp-text-accent)' }}>
              Preço sob consulta
            </p>
            <button
              onClick={() => setQuoteOpen(true)}
              className="mp-btn-primary w-full mt-4"
            >
              Solicitar Orçamento
            </button>
          </div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <div className="pt-6" style={{ borderTop: '1px solid var(--mp-border-default)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--mp-text-default)' }}>
              Especificações
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((spec) => (
                <div key={spec!.label} className="flex items-center gap-3">
                  <span style={{ color: 'var(--mp-text-muted)' }}>{spec!.icon}</span>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--mp-text-muted)' }}>{spec!.label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--mp-text-default)' }}>{spec!.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="pt-6" style={{ borderTop: '1px solid var(--mp-border-default)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--mp-text-default)' }}>
              Descrição
            </h2>
            <p className="text-sm whitespace-pre-line" style={{ color: 'var(--mp-text-secondary)', lineHeight: '1.7' }}>
              {product.description}
            </p>
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
