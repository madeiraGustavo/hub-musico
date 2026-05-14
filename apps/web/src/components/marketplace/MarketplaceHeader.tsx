'use client'

import { useEffect, useState } from 'react'
import { getAccessToken } from '@/lib/api/client'

export function MarketplaceHeader() {
  const [isArtist, setIsArtist] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      setIsLoggedIn(true)
      // Decode JWT payload to check role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role === 'artist' || payload.role === 'admin') {
          setIsArtist(true)
        }
      } catch {
        // Invalid token
      }
    }
  }, [])

  return (
    <header className="border-b border-border-default bg-bg-surface sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/marketplace" className="text-lg font-semibold text-text-default">
          Marketplace
        </a>
        <nav className="flex items-center gap-4">
          <a href="/marketplace/cart" className="text-sm text-text-muted hover:text-text-default transition-colors">
            Carrinho
          </a>
          {isArtist && (
            <a href="/dashboard/marketplace" className="text-sm text-text-muted hover:text-text-default transition-colors">
              Dashboard
            </a>
          )}
          {!isLoggedIn && (
            <a href="/login" className="text-sm px-3 py-1.5 rounded bg-bg-accent text-text-on-accent hover:opacity-90 transition-opacity">
              Login
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
