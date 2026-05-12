'use client'

import { useState } from 'react'
import type { Slot } from './AvailabilityCalendar'

interface AppointmentFormProps {
  artistId: string
  slot:     Slot
  timezone: string
}

interface FormState {
  requesterName:  string
  requesterEmail: string
  requesterPhone: string
  notes:          string
}

/**
 * Formulário de solicitação de agendamento.
 * Campos: nome (obrigatório), email (obrigatório), telefone (opcional), observações (opcional).
 * Ao submeter, chama POST /public/artists/:artistId/appointments.
 * Em caso de sucesso, exibe requestCode e status PENDING.
 * Em caso de conflito (409), exibe mensagem de horário indisponível.
 *
 * Requirements: 10.3, 10.4
 */
export function AppointmentForm({ artistId, slot, timezone }: AppointmentFormProps) {
  const [form, setForm] = useState<FormState>({
    requesterName:  '',
    requesterEmail: '',
    requesterPhone: '',
    notes:          '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]         = useState<{ requestCode: string; status: string } | null>(null)
  const [error, setError]           = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setResult(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

    try {
      const res = await fetch(`${apiUrl}/public/artists/${artistId}/appointments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName:  form.requesterName,
          requesterEmail: form.requesterEmail,
          requesterPhone: form.requesterPhone || undefined,
          startAt:        slot.startAt,
          endAt:          slot.endAt,
          notes:          form.notes || undefined,
        }),
      })

      if (res.status === 409) {
        setError('Este horário não está mais disponível. Por favor, escolha outro.')
        return
      }

      if (res.status === 422) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Dados inválidos. Verifique os campos e tente novamente.')
        return
      }

      if (!res.ok) {
        setError('Ocorreu um erro. Tente novamente.')
        return
      }

      const data = await res.json() as { requestCode: string; status: string }
      setResult(data)
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Exibir resultado de sucesso
  if (result) {
    return (
      <div className="bg-bg-elevated border border-[rgba(108,99,255,0.35)] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-accent mb-2">Solicitação enviada!</h4>
        <p className="text-text-secondary text-sm mb-4">
          Seu código de acompanhamento:
        </p>
        <div className="bg-bg-surface rounded-md px-4 py-3 font-mono text-sm text-text-primary break-all">
          {result.requestCode}
        </div>
        <p className="text-text-muted text-xs mt-3">
          Status: <span className="text-yellow-400 font-medium">{result.status}</span>
          {' '}— O artista irá confirmar ou rejeitar sua solicitação.
        </p>
      </div>
    )
  }

  const startTime = new Date(slot.startAt).toLocaleTimeString('pt-BR', {
    timeZone: timezone,
    hour:     '2-digit',
    minute:   '2-digit',
  })
  const endTime = new Date(slot.endAt).toLocaleTimeString('pt-BR', {
    timeZone: timezone,
    hour:     '2-digit',
    minute:   '2-digit',
  })

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="text-sm text-text-secondary mb-2">
        Horário selecionado: <span className="text-text-primary font-medium">{startTime} — {endTime}</span>
      </div>

      <div>
        <label htmlFor="requesterName" className="block text-sm text-text-secondary mb-1">
          Nome *
        </label>
        <input
          id="requesterName"
          name="requesterName"
          type="text"
          required
          value={form.requesterName}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md bg-bg-surface border border-[rgba(255,255,255,0.07)]
            text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="Seu nome completo"
        />
      </div>

      <div>
        <label htmlFor="requesterEmail" className="block text-sm text-text-secondary mb-1">
          Email *
        </label>
        <input
          id="requesterEmail"
          name="requesterEmail"
          type="email"
          required
          value={form.requesterEmail}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md bg-bg-surface border border-[rgba(255,255,255,0.07)]
            text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label htmlFor="requesterPhone" className="block text-sm text-text-secondary mb-1">
          Telefone (opcional)
        </label>
        <input
          id="requesterPhone"
          name="requesterPhone"
          type="tel"
          value={form.requesterPhone}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md bg-bg-surface border border-[rgba(255,255,255,0.07)]
            text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm text-text-secondary mb-1">
          Observações (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md bg-bg-surface border border-[rgba(255,255,255,0.07)]
            text-text-primary text-sm focus:outline-none focus:border-accent transition-colors resize-none"
          placeholder="Alguma informação adicional..."
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-[rgba(255,60,60,0.1)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-md bg-accent text-white font-medium text-sm
          hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Enviando...' : 'Solicitar agendamento'}
      </button>
    </form>
  )
}
