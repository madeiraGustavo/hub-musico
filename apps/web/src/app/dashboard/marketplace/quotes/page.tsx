'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '@/lib/api/client'
import { PaginationControls } from '@/components/marketplace/PaginationControls'

interface Quote {
  id: string
  requesterName: string
  requesterEmail: string
  message: string
  status: string
  createdAt: string
  product: { id: string; title: string }
}

interface Meta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ANSWERED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-600',
}

export default function DashboardQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  function loadQuotes() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (statusFilter) params.set('status', statusFilter)

    apiGet<{ data: Quote[]; meta: Meta }>(`/dashboard/marketplace/quotes?${params}`)
      .then((res) => {
        setQuotes(res.data)
        setMeta(res.meta)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadQuotes() }, [page, statusFilter])

  async function updateStatus(id: string, status: string, responseMessage?: string) {
    try {
      await apiPatch(`/dashboard/marketplace/quotes/${id}/status`, { status, responseMessage })
      loadQuotes()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-default">Orçamentos</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        {['', 'PENDING', 'ANSWERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              statusFilter === s ? 'bg-bg-accent text-text-on-accent border-border-accent' : 'border-border-default text-text-muted hover:border-border-hover'
            }`}
          >
            {s || 'Todos'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {quotes.map((quote) => (
          <div key={quote.id} className="p-4 border border-border-default rounded-lg bg-bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-text-default">{quote.requesterName}</span>
                <span className="text-text-muted text-xs ml-2">{quote.requesterEmail}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[quote.status] ?? ''}`}>
                {quote.status}
              </span>
            </div>
            <p className="text-sm text-text-muted">Produto: {quote.product.title}</p>
            <p className="text-sm text-text-default">{quote.message}</p>
            {quote.status === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    const msg = prompt('Mensagem de resposta:')
                    if (msg) updateStatus(quote.id, 'ANSWERED', msg)
                  }}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Responder
                </button>
                <button
                  onClick={() => updateStatus(quote.id, 'REJECTED')}
                  className="text-xs px-3 py-1 bg-red-500 text-white rounded"
                >
                  Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
        {quotes.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">Nenhum orçamento encontrado.</p>
        )}
      </div>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  )
}
