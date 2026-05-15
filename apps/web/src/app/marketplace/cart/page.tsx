'use client'

import { useCartStore } from '@/stores/cartStore'
import { useToastStore } from '@/stores/toastStore'
import { Breadcrumb } from '@/components/marketplace/Breadcrumb'
import { EmptyState } from '@/components/marketplace/EmptyState'
import { CheckoutStepper } from '@/components/marketplace/CheckoutStepper'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()
  const addToast = useToastStore((s) => s.addToast)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  function handleRemove(productId: string, title: string) {
    removeItem(productId)
    addToast({ type: 'info', message: `"${title}" removido do carrinho` })
  }

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Carrinho' }]} />
        <EmptyState
          icon="cart"
          title="Seu carrinho está vazio"
          description="Adicione produtos ao carrinho para continuar com sua compra."
          action={{ label: 'Ver Catálogo', href: '/marketplace' }}
        />
      </>
    )
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Carrinho' }]} />

      {/* Stepper */}
      <CheckoutStepper currentStep="cart" completedSteps={[]} />

      <h1 className="mp-heading-2 mt-4 mb-6">Carrinho</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 p-4 mp-card"
          >
            <div className="w-16 h-16 rounded-[var(--mp-radius-sm)] flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--mp-bg-muted)' }}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--mp-text-muted)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <a
                href={`/marketplace/product/${item.slug}`}
                className="text-sm font-medium truncate block transition-colors duration-200"
                style={{ color: 'var(--mp-text-default)' }}
              >
                {item.title}
              </a>
              <p className="text-sm" style={{ color: 'var(--mp-text-muted)' }}>
                {formatPrice(item.unitPrice)} un.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                aria-label="Diminuir quantidade"
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-150 disabled:opacity-40"
                style={{ border: '1px solid var(--mp-border-default)', color: 'var(--mp-text-default)' }}
              >
                −
              </button>
              <span className="text-sm font-medium w-8 text-center" style={{ color: 'var(--mp-text-default)' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label="Aumentar quantidade"
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-150"
                style={{ border: '1px solid var(--mp-border-default)', color: 'var(--mp-text-default)' }}
              >
                +
              </button>
            </div>

            <div className="text-right w-24">
              <p className="text-sm font-semibold" style={{ color: 'var(--mp-text-default)' }}>
                {formatPrice(item.quantity * item.unitPrice)}
              </p>
            </div>

            <button
              onClick={() => handleRemove(item.productId, item.title)}
              aria-label={`Remover ${item.title} do carrinho`}
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: 'var(--mp-text-accent)' }}
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--mp-border-default)' }}>
        <button
          onClick={clearCart}
          className="text-sm transition-colors duration-150"
          style={{ color: 'var(--mp-text-muted)' }}
        >
          Limpar carrinho
        </button>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: 'var(--mp-text-default)', fontFamily: 'var(--mp-font-heading)' }}>
            {formatPrice(total())}
          </p>
          <a href="/marketplace/checkout" className="mp-btn-primary inline-block mt-3">
            Finalizar Compra
          </a>
        </div>
      </div>
    </>
  )
}
