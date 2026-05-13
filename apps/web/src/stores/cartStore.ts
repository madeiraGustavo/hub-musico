import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  slug: string
  title: string
  unitPrice: number
  quantity: number
  maxStock: number | null
  thumbnailUrl: string | null
}

export interface CartProduct {
  id: string
  slug: string
  title: string
  type: 'FIXED_PRICE' | 'QUOTE_ONLY'
  basePrice: number | null
  stock: number | null
  thumbnailUrl: string | null
}

export interface CartStore {
  items: CartItem[]
  addItem: (product: CartProduct) => boolean
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: CartProduct) => {
        // Only FIXED_PRICE with positive basePrice
        if (product.type !== 'FIXED_PRICE' || !product.basePrice || product.basePrice <= 0) {
          return false
        }

        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            // Increment quantity (clamped)
            const maxQty = product.stock !== null ? Math.min(99, product.stock) : 99
            const newQty = Math.min(existing.quantity + 1, maxQty)
            return {
              items: state.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: newQty } : i,
              ),
            }
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                title: product.title,
                unitPrice: product.basePrice!,
                quantity: 1,
                maxStock: product.stock,
                thumbnailUrl: product.thumbnailUrl,
              },
            ],
          }
        })

        return true
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId !== productId) return item
            const maxQty = item.maxStock !== null ? Math.min(99, item.maxStock) : 99
            const clamped = Math.max(1, Math.min(quantity, maxQty))
            return { ...item, quantity: clamped }
          }),
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      },
    }),
    {
      name: 'marketplace-cart',
    },
  ),
)
