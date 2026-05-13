'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (items.length === 0 && !success) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text-default mb-2">Carrinho vazio</h1>
        <a href="/marketplace" className="text-sm text-text-accent">Voltar ao catálogo</a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-text-default mb-2">Pedido realizado!</h1>
        <p className="text-text-muted text-sm mb-4">Código: {orderId}</p>
        <a href="/marketplace" className="text-sm text-text-accent">Voltar ao catálogo</a>
      </div>
    )
  }

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!form.customerName.trim()) newErrors.customerName = 'Nome é obrigatório'
    if (form.customerName.length > 100) newErrors.customerName = 'Máximo 100 caracteres'
    if (!form.customerEmail.trim()) newErrors.customerEmail = 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) newErrors.customerEmail = 'Email inválido'
    if (!form.customerPhone.trim()) newErrors.customerPhone = 'Telefone é obrigatório'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const body = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }

      const res = await fetch(`${API_URL}/marketplace/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        setOrderId(data.data.orderId)
        setSuccess(true)
        clearCart()
      } else {
        const data = await res.json()
        setErrors({ form: data.error ?? 'Erro ao criar pedido' })
      }
    } catch {
      setErrors({ form: 'Erro de conexão' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-default mb-6">Checkout</h1>

        {errors.form && <p className="text-red-500 text-sm mb-4">{errors.form}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-default mb-1">Nome completo *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              maxLength={100}
            />
            {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-default mb-1">Email *</label>
            <input
              type="email"
              value={form.customerEmail}
              onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
            />
            {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-default mb-1">Telefone *</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              maxLength={20}
            />
            {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-bg-accent text-text-on-accent rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? 'Processando...' : `Confirmar Pedido — ${formatPrice(total())}`}
          </button>
        </form>
      </div>

      {/* Order Summary */}
      <div className="lg:border-l lg:border-border-default lg:pl-8">
        <h2 className="text-lg font-semibold text-text-default mb-4">Resumo do Pedido</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-text-default">{item.title} ×{item.quantity}</span>
              <span className="text-text-default">{formatPrice(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
          <div className="border-t border-border-default pt-3 flex justify-between font-semibold">
            <span className="text-text-default">Total</span>
            <span className="text-text-default">{formatPrice(total())}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
