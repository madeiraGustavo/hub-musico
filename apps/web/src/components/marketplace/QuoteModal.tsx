'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface QuoteModalProps {
  productId: string
  productTitle: string
  isOpen: boolean
  onClose: () => void
}

export function QuoteModal({ productId, productTitle, isOpen, onClose }: QuoteModalProps) {
  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    widthCm: '',
    heightCm: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!form.requesterName.trim()) newErrors.requesterName = 'Nome é obrigatório'
    if (form.requesterName.length > 100) newErrors.requesterName = 'Máximo 100 caracteres'
    if (!form.requesterEmail.trim()) newErrors.requesterEmail = 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) newErrors.requesterEmail = 'Email inválido'
    if (!form.requesterPhone.trim()) newErrors.requesterPhone = 'Telefone é obrigatório'
    if (!form.widthCm.trim() && !form.heightCm.trim()) {
      newErrors.widthCm = 'Informe ao menos uma dimensão'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const body = {
        productId,
        requesterName: form.requesterName,
        requesterEmail: form.requesterEmail,
        requesterPhone: form.requesterPhone || undefined,
        widthCm: form.widthCm ? parseFloat(form.widthCm) : undefined,
        heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
        message: form.message || `Orçamento para ${productTitle}`,
        quantity: 1,
      }

      const res = await fetch(`${API_URL}/marketplace/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setErrors({ form: data.error ?? 'Erro ao enviar orçamento' })
      }
    } catch {
      setErrors({ form: 'Erro de conexão' })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="bg-bg-surface rounded-lg p-8 max-w-md w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-text-default mb-2">Orçamento enviado!</h3>
          <p className="text-text-muted text-sm mb-4">Entraremos em contato em breve.</p>
          <button onClick={onClose} className="px-4 py-2 bg-bg-accent text-text-on-accent rounded text-sm">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-bg-surface rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text-default mb-4">
          Solicitar Orçamento — {productTitle}
        </h3>

        {errors.form && (
          <p className="text-red-500 text-sm mb-3">{errors.form}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-default mb-1">Nome *</label>
            <input
              type="text"
              value={form.requesterName}
              onChange={e => setForm(f => ({ ...f, requesterName: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              maxLength={100}
            />
            {errors.requesterName && <p className="text-red-500 text-xs mt-1">{errors.requesterName}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-default mb-1">Email *</label>
            <input
              type="email"
              value={form.requesterEmail}
              onChange={e => setForm(f => ({ ...f, requesterEmail: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
            />
            {errors.requesterEmail && <p className="text-red-500 text-xs mt-1">{errors.requesterEmail}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-default mb-1">Telefone *</label>
            <input
              type="tel"
              value={form.requesterPhone}
              onChange={e => setForm(f => ({ ...f, requesterPhone: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              maxLength={20}
            />
            {errors.requesterPhone && <p className="text-red-500 text-xs mt-1">{errors.requesterPhone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-default mb-1">Largura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.widthCm}
                onChange={e => setForm(f => ({ ...f, widthCm: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-text-default mb-1">Altura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.heightCm}
                onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))}
                className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm"
              />
            </div>
            {errors.widthCm && <p className="text-red-500 text-xs col-span-2">{errors.widthCm}</p>}
          </div>

          <div>
            <label className="block text-sm text-text-default mb-1">Mensagem</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-border-default bg-bg-base text-text-default text-sm resize-none"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded border border-border-default text-text-default text-sm hover:bg-bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded bg-bg-accent text-text-on-accent text-sm disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
