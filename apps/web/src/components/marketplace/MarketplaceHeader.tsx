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
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.role === 'artist' || payload.role === 'admin') {
          setIsArtist(true)
        }
      } catch {}
    }
  }, [])

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="/marketplace" className="text-xl font-bold text-white">
          Lonas SP
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="/marketplace" className="text-sm text-gray-300 hover:text-white transition-colors">
            Catálogo
          </a>
          <a href="/marketplace/cart" className="text-sm text-gray-300 hover:text-white transition-colors">
            Carrinho
          </a>
          {isArtist && (
            <a href="/dashboard/marketplace" className="text-sm text-gray-300 hover:text-white transition-colors">
              Dashboard
            </a>
          )}
        </nav>
        {!isLoggedIn ? (
          <a href="/login" className="px-5 py-2 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-gray-900 transition-colors">
            Log In
          </a>
        ) : (
          <a href="/dashboard/marketplace" className="px-5 py-2 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-gray-900 transition-colors">
            Minha Conta
          </a>
        )}
      </div>
    </header>
  )
}
