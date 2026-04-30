'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Início',   icon: '⊞' },
  { href: '/dashboard/tracks',   label: 'Faixas',   icon: '♪' },
  { href: '/dashboard/projects', label: 'Projetos', icon: '▶' },
  { href: '/dashboard/profile',  label: 'Perfil',   icon: '◉' },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-bg-surface border-r border-[rgba(255,255,255,0.07)]
        flex flex-col z-50 max-lg:hidden">

        <div className="p-6 border-b border-[rgba(255,255,255,0.07)]">
          <div className="font-head text-xl font-bold bg-grad-main bg-clip-text text-transparent">
            MAX SOUZA
          </div>
          <p className="text-xs text-text-muted mt-1">Painel Administrativo</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all
                ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'bg-accent-dim text-accent border border-[rgba(108,99,255,0.35)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-[rgba(255,255,255,0.07)]">
          <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-md text-sm
            text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all mb-1">
            ← Ver portfólio
          </a>
          <button onClick={handleLogout} disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm
              text-red-400 hover:bg-[rgba(255,60,60,0.1)] transition-all disabled:opacity-50">
            {loggingOut ? 'Saindo...' : '↩ Sair'}
          </button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-bg-surface border-b border-[rgba(255,255,255,0.07)]
        flex items-center justify-between px-4 z-50 lg:hidden">
        <div className="font-head text-lg font-bold bg-grad-main bg-clip-text text-transparent">
          MAX SOUZA
        </div>
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href}
              className={`p-2 rounded-md text-sm transition-all
                ${pathname === item.href ? 'text-accent bg-accent-dim' : 'text-text-secondary'}`}>
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
