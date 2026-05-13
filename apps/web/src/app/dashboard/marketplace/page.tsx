'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { MetricsCard } from '@/components/marketplace/dashboard/MetricsCard'

interface Metrics {
  activeProducts: number
  pendingQuotes: number
  pendingOrders: number
}

export default function DashboardMarketplacePage() {
  const [metrics, setMetrics] = useState<Metrics>({ activeProducts: 0, pendingQuotes: 0, pendingOrders: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiGet<{ data: unknown[]; meta: { total: number } }>('/dashboard/marketplace/products?pageSize=1'),
      apiGet<{ data: unknown[]; meta: { total: number } }>('/dashboard/marketplace/quotes?status=PENDING&pageSize=1'),
      apiGet<{ data: unknown[]; meta: { total: number } }>('/dashboard/marketplace/orders?status=PENDING&pageSize=1'),
    ])
      .then(([products, quotes, orders]) => {
        setMetrics({
          activeProducts: products.meta.total,
          pendingQuotes: quotes.meta.total,
          pendingOrders: orders.meta.total,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-text-muted text-sm">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-default">Marketplace</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricsCard label="Produtos Ativos" value={metrics.activeProducts} />
        <MetricsCard label="Orçamentos Pendentes" value={metrics.pendingQuotes} />
        <MetricsCard label="Pedidos Pendentes" value={metrics.pendingOrders} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/dashboard/marketplace/products" className="block p-4 rounded-lg border border-border-default bg-bg-surface hover:border-border-hover transition-colors">
          <h3 className="font-medium text-text-default">Produtos</h3>
          <p className="text-sm text-text-muted mt-1">Gerenciar catálogo</p>
        </a>
        <a href="/dashboard/marketplace/categories" className="block p-4 rounded-lg border border-border-default bg-bg-surface hover:border-border-hover transition-colors">
          <h3 className="font-medium text-text-default">Categorias</h3>
          <p className="text-sm text-text-muted mt-1">Organizar produtos</p>
        </a>
        <a href="/dashboard/marketplace/quotes" className="block p-4 rounded-lg border border-border-default bg-bg-surface hover:border-border-hover transition-colors">
          <h3 className="font-medium text-text-default">Orçamentos</h3>
          <p className="text-sm text-text-muted mt-1">Responder solicitações</p>
        </a>
        <a href="/dashboard/marketplace/orders" className="block p-4 rounded-lg border border-border-default bg-bg-surface hover:border-border-hover transition-colors">
          <h3 className="font-medium text-text-default">Pedidos</h3>
          <p className="text-sm text-text-muted mt-1">Processar vendas</p>
        </a>
      </div>
    </div>
  )
}
