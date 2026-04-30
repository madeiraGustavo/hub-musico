'use client'

/**
 * AudioProvider.tsx
 *
 * Inicializa o AudioService uma única vez no root do app.
 * Não renderiza nada — apenas efeito colateral de inicialização.
 */

import { useEffect } from 'react'
import { initAudioService } from '@/services/audio/AudioService'

export function AudioProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAudioService()
  }, [])

  return <>{children}</>
}
