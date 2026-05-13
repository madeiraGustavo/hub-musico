'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '@/lib/api/client'
import { PaginationControls } from '@/components/marketplace/PaginationControls'

interface Order {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  createdAt: string
  items: Array<{ id: string; quantity: number; unitPrice: number; product: { title: string } }>
}

interface Meta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')

  function loadOrders() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (statusFilter) params.set('status', statusFilter)

    apiGet<{ data: Order[]; meta: Meta }>(`/dashboard/marketplace/orders?${params}`)
      .then((res) => {
        setOrders(res.data)
        setMeta(res.meta)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [page, statusFilter])

  async function advanceStatus(id: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return
    try {
      await apiPatch(`/dashboard/marketplace/orders/${id}/status`, { status: next })
      loadOrders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function cancelOrder(id: string) {
    if (!confirm('Cancelar este pedido?')) return
    try {
      await apiPatch(`/dashboard/marketplace/orders/${id}/status`, { status: 'CANCELLED' })
      loadOrders()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-default">Pedidos</h1>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        {['', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
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
        {orders.map((order) => (
          <div key={order.id} className="p-4 border border-border-default rounded-lg bg-bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-text-default">{order.customerName}</span>
                <span className="text-text-muted text-xs ml-2">{formatPrice(Number(order.total))}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[order.status] ?? ''}`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-text-muted">
              {order.items.map((item) => (
                <span key={item.id} className="mr-3">
                  {item.product.title} ×{item.quantity}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => advanceStatus(order.id, order.status)}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded"
                >
                  → {NEXT_STATUS[order.status]}
                </button>
              )}
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="text-xs px-3 py-1 bg-red-500 text-white rounded"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">Nenhum pedido encontrado.</p>
        )}
      </div>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  )
}
