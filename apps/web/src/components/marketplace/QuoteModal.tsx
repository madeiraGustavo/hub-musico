'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface QuoteModalProps {
  productId: string
  productTitle: string
  isOpen: boolean
  onClose: () => void
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements)
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
  const [animateIn, setAnimateIn] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Capture the trigger element when modal opens
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
      // Trigger animation on next frame
      requestAnimationFrame(() => setAnimateIn(true))
    } else {
      setAnimateIn(false)
    }
  }, [isOpen])

  // Focus trap and Escape key handler
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current)
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last!.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first!.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus first focusable element on open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = getFocusableElements(modalRef.current)
      if (focusable.length > 0) {
        focusable[0]!.focus()
      }
    }
  }, [isOpen, success])

  // Return focus to trigger on close
  const handleClose = useCallback(() => {
    onClose()
    // Restore focus after the modal unmounts
    setTimeout(() => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus()
      }
    }, 0)
  }, [onClose])

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

  const modalTitleId = 'quote-modal-title'

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: animateIn ? 1 : 0,
          transition: 'opacity 150ms ease',
        }}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          className="bg-bg-surface rounded-lg p-8 max-w-md w-full mx-4 text-center"
          style={{
            transform: animateIn ? 'scale(1)' : 'scale(0.95)',
            opacity: animateIn ? 1 : 0,
            transition: 'transform 200ms ease, opacity 200ms ease',
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 id={modalTitleId} className="text-lg font-semibold text-text-default mb-2">Orçamento enviado!</h3>
          <p className="text-text-muted text-sm mb-4">Entraremos em contato em breve.</p>
          <button onClick={handleClose} className="px-4 py-2 bg-bg-accent text-text-on-accent rounded text-sm">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        opacity: animateIn ? 1 : 0,
        transition: 'opacity 150ms ease',
      }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="bg-bg-surface rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          transform: animateIn ? 'scale(1)' : 'scale(0.95)',
          opacity: animateIn ? 1 : 0,
          transition: 'transform 200ms ease, opacity 200ms ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id={modalTitleId} className="text-lg font-semibold text-text-default mb-4">
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
              onClick={handleClose}
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
