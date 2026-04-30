'use client'

import { useState, useMemo } from 'react'
import { MUSICAS } from '@/lib/data'
import type { FilterGenre } from '@/types'

export function useFilter() {
  const [active, setActive] = useState<FilterGenre>('all')

  const visibleMusicas = useMemo(
    () => MUSICAS.filter(m => active === 'all' || m.genre === active),
    [active],
  )

  const visibleIds = useMemo(() => visibleMusicas.map(m => m.id), [visibleMusicas])

  return { active, setActive, visibleMusicas, visibleIds }
}
