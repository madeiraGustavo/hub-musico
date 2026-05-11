'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api/client'

interface SessionData {
  authenticated: true
  user: { id: string; email: string; role: string }
  artist: { id: string; slug: string } | null
}

export default function DashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null)

  useEffect(() => {
    apiGet<SessionData>('/auth/session')
      .then(setSession)
      .catch(() => {
        // apiGet já trata 401 com redirectToLogin() — nada a fazer aqui
      })
  }, [])

  return (
    <div>
      <h1 className="font-head text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-text-secondary mb-8">
        Bem-vindo, <span className="text-accent">{session?.user.email}</span>
        <span className="ml-2 text-xs bg-accent-dim text-accent px-2 py-0.5 rounded-xl uppercase tracking-wider">
          {session?.user.role}
        </span>
      </p>

      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
        {[
          { label: 'Faixas',   href: '/dashboard/tracks',   icon: '🎵' },
          { label: 'Projetos', href: '/dashboard/projects',  icon: '🎬' },
          { label: 'Serviços', href: '/dashboard/services',  icon: '💼' },
          { label: 'Perfil',   href: '/dashboard/profile',   icon: '👤' },
        ].map(card => (
          <a key={card.href} href={card.href}
            className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-6
              hover:border-[rgba(108,99,255,0.35)] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-head text-lg font-bold">{card.label}</h3>
          </a>
        ))}
      </div>
    </div>
  )
}
