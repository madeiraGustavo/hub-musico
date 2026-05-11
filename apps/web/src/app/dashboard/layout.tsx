'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

interface SessionData {
  authenticated: true
  user: { id: string; email: string; role: string }
  artist: { id: string; slug: string } | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<SessionData>('/auth/session')
      .then(() => setLoading(false))
      .catch(() => {
        // apiGet já trata 401 com redirectToLogin() — nada a fazer aqui
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <span className="text-text-muted text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      <DashboardNav />
      <main className="flex-1 ml-64 p-8 max-lg:ml-0 max-lg:pt-20">
        {children}
      </main>
    </div>
  )
}
