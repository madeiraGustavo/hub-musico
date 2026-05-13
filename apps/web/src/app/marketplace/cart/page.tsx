'use client'

import { useCartStore } from '@/stores/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text-default mb-2">Carrinho vazio</h1>
        <p className="text-text-muted text-sm mb-4">Adicione produtos ao carrinho para continuar.</p>
        <a href="/marketplace" className="text-sm text-text-accent">
          Voltar ao catálogo
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-default">Carrinho</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4 border border-border-default rounded-lg bg-bg-surface">
            <div className="w-16 h-16 bg-bg-muted rounded flex-shrink-0 overflow-hidden">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">—</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <a href={`/marketplace/product/${item.slug}`} className="text-sm font-medium text-text-default hover:text-text-accent truncate block">
                {item.title}
              </a>
              <p className="text-sm text-text-muted">{formatPrice(item.unitPrice)} un.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-7 h-7 rounded border border-border-default text-text-default text-sm disabled:opacity-50"
              >
                −
              </button>
              <span className="text-sm text-text-default w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-7 h-7 rounded border border-border-default text-text-default text-sm"
              >
                +
              </button>
            </div>

            <div className="text-right w-24">
              <p className="text-sm font-medium text-text-default">
                {formatPrice(item.quantity * item.unitPrice)}
              </p>
            </div>

            <button
              onClick={() => removeItem(item.productId)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border-default">
        <button onClick={clearCart} className="text-sm text-text-muted hover:text-text-default">
          Limpar carrinho
        </button>
        <div className="text-right">
          <p className="text-lg font-bold text-text-default">{formatPrice(total())}</p>
          <a
            href="/marketplace/checkout"
            className="inline-block mt-2 px-6 py-2 bg-bg-accent text-text-on-accent rounded text-sm font-medium"
          >
            Finalizar Compra
          </a>
        </div>
      </div>
    </div>
  )
}
