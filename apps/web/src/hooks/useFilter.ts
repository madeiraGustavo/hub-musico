'use client'

import { useState, useMemo } from 'react'
import type { Track, TrackGenre } from '@hub-art/types'

export function useFilter(tracks: Track[]) {
  const [active, setActive] = useState<TrackGenre>('all')

  const visibleTracks = useMemo(
    () => (active === 'all' ? tracks : tracks.filter(t => t.genre === active)),
    [active, tracks],
  )

  const visibleIds = useMemo(() => visibleTracks.map(t => t.id), [visibleTracks])

  return { active, setActive, visibleTracks, visibleIds }
}
