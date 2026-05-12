'use client'

import { useState } from 'react'

interface StatusResult {
  requestCode: string
  status:      string
  startAt:     string
  endAt:       string
}

interface StatusCheckerProps {
  timezone: string
}

/**
 * Campo de texto para inserir requestCode.
 * Ao submeter, chama GET /public/appointments/:requestCode.
 * Exibe status, startAt e endAt formatados no timezone do artista.
 *
 * Requirements: 10.5
 */
export function StatusChecker({ timezone }: StatusCheckerProps) {
  const [requestCode, setRequestCode] = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<StatusResult | null>(null)
  const [error, setError]             = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requestCode.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

    try {
      const res = await fetch(`${apiUrl}/public/appointments/${requestCode.trim()}`)

      if (res.status === 404) {
        setError('Código não encontrado. Verifique e tente novamente.')
        return
      }

      if (!res.ok) {
        setError('Ocorreu um erro. Tente novamente.')
        return
      }

      const data = await res.json() as StatusResult
      setResult(data)
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(isoStr: string): string {
    return new Date(isoStr).toLocaleString('pt-BR', {
      timeZone: timezone,
      day:      '2-digit',
      month:    'long',
      hour:     '2-digit',
      minute:   '2-digit',
    })
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Pendente',   color: 'text-yellow-400' },
    CONFIRMED: { label: 'Confirmado', color: 'text-green-400' },
    CANCELLED: { label: 'Cancelado',  color: 'text-red-400' },
    REJECTED:  { label: 'Rejeitado',  color: 'text-red-400' },
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={requestCode}
          onChange={(e) => setRequestCode(e.target.value)}
          placeholder="Cole seu código de acompanhamento"
          className="flex-1 px-3 py-2 rounded-md bg-bg-surface border border-[rgba(255,255,255,0.07)]
            text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          aria-label="Código de acompanhamento"
        />
        <button
          type="submit"
          disabled={loading || !requestCode.trim()}
          className="px-4 py-2 rounded-md bg-accent text-white text-sm font-medium
            hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Consultar'}
        </button>
      </form>

      {error && (
        <div className="mt-3 text-red-400 text-sm bg-[rgba(255,60,60,0.1)] rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Status:</span>
            <span className={`text-sm font-medium ${statusLabels[result.status]?.color ?? 'text-text-primary'}`}>
              {statusLabels[result.status]?.label ?? result.status}
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-secondary">Início:</span>
            <span className="text-sm text-text-primary">{formatDateTime(result.startAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Fim:</span>
            <span className="text-sm text-text-primary">{formatDateTime(result.endAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
