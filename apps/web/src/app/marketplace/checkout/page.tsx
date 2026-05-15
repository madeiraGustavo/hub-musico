'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { useToastStore } from '@/stores/toastStore'
import { Breadcrumb } from '@/components/marketplace/Breadcrumb'
import { CheckoutStepper } from '@/components/marketplace/CheckoutStepper'
import { EmptyState } from '@/components/marketplace/EmptyState'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const addToast = useToastStore((s) => s.addToast)
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (items.length === 0 && !success) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Checkout' }]} />
        <EmptyState
          icon="cart"
          title="Carrinho vazio"
          description="Adicione produtos ao carrinho antes de finalizar a compra."
          action={{ label: 'Ver Catálogo', href: '/marketplace' }}
        />
      </>
    )
  }

  if (success) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Confirmação' }]} />
        <CheckoutStepper currentStep="confirmation" completedSteps={['cart', 'data']} />
        <div className="text-center py-16">
          {/* Celebration icon */}
          <div className="mp-fade-in mb-6">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="mx-auto">
              <circle cx="32" cy="32" r="28" stroke="var(--mp-accent)" strokeWidth="3" fill="none" />
              <path d="M20 32l8 8 16-16" stroke="var(--mp-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mp-heading-2 mp-fade-in-delay-1">Pedido realizado!</h1>
          <p className="mt-3 mp-fade-in-delay-2" style={{ color: 'var(--mp-text-secondary)' }}>
            Código do pedido: <strong>{orderId}</strong>
          </p>
          <p className="mt-1 mp-fade-in-delay-2" style={{ color: 'var(--mp-text-muted)' }}>
            Entraremos em contato em breve para confirmar seu pedido.
          </p>
          <a href="/marketplace" className="mp-btn-primary inline-block mt-8 mp-fade-in-delay-3">
            Voltar ao Catálogo
          </a>
        </div>
      </>
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
        addToast({ type: 'success', message: 'Pedido realizado com sucesso!' })
      } else {
        const data = await res.json()
        const errorMsg = data.error ?? 'Erro ao criar pedido'
        setErrors({ form: errorMsg })
        addToast({ type: 'error', message: errorMsg })
      }
    } catch {
      setErrors({ form: 'Erro de conexão' })
      addToast({ type: 'error', message: 'Erro de conexão. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Marketplace', href: '/marketplace' }, { label: 'Checkout' }]} />

      {/* Stepper */}
      <CheckoutStepper currentStep="data" completedSteps={['cart']} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <div>
          <h1 className="mp-heading-2 mb-6">Dados do Pedido</h1>

          {errors.form && (
            <p className="text-sm mb-4" style={{ color: '#dc2626' }}>{errors.form}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mp-text-default)' }}>
                Nome completo *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg text-sm transition-colors duration-200 outline-none"
                style={{
                  border: '1px solid var(--mp-border-default)',
                  backgroundColor: 'var(--mp-bg-elevated)',
                  color: 'var(--mp-text-default)',
                }}
                maxLength={100}
              />
              {errors.customerName && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mp-text-default)' }}>
                Email *
              </label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg text-sm transition-colors duration-200 outline-none"
                style={{
                  border: '1px solid var(--mp-border-default)',
                  backgroundColor: 'var(--mp-bg-elevated)',
                  color: 'var(--mp-text-default)',
                }}
              />
              {errors.customerEmail && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.customerEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--mp-text-default)' }}>
                Telefone *
              </label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg text-sm transition-colors duration-200 outline-none"
                style={{
                  border: '1px solid var(--mp-border-default)',
                  backgroundColor: 'var(--mp-bg-elevated)',
                  color: 'var(--mp-text-default)',
                }}
                maxLength={20}
              />
              {errors.customerPhone && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.customerPhone}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mp-btn-primary w-full mt-4"
            >
              {submitting ? 'Processando...' : `Confirmar Pedido — ${formatPrice(total())}`}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:pl-8" style={{ borderLeft: '1px solid var(--mp-border-default)' }}>
          <h2 className="mp-heading-3 mb-4">Resumo do Pedido</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span style={{ color: 'var(--mp-text-default)' }}>{item.title} ×{item.quantity}</span>
                <span style={{ color: 'var(--mp-text-default)' }}>{formatPrice(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
            <div className="pt-3 flex justify-between font-semibold" style={{ borderTop: '1px solid var(--mp-border-default)' }}>
              <span style={{ color: 'var(--mp-text-default)' }}>Total</span>
              <span style={{ color: 'var(--mp-text-default)', fontFamily: 'var(--mp-font-heading)', fontSize: '1.25rem' }}>
                {formatPrice(total())}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
