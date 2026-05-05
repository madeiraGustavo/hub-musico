'use client'

import { useEffect, useState } from 'react'
import { audioService }        from '@/services/audio/AudioService'
import { usePlayerStore }      from '@/services/audio/usePlayerStore'
import { useFilter }           from '@/hooks/useFilter'
import { MusicaCard }          from '@/components/musician/MusicaCard'
import { Player }              from '@/components/Player'
import type { Track, TrackGenre } from '@hub-musico/types'

interface Props {
  tracks: Track[]
}

const FILTERS: { value: TrackGenre; label: string }[] = [
  { value: 'all',        label: 'Todas' },
  { value: 'piano',      label: 'Piano' },
  { value: 'jazz',       label: 'Jazz' },
  { value: 'ambient',    label: 'Ambient' },
  { value: 'orquestral', label: 'Orquestral' },
  { value: 'rock',       label: 'Rock' },
  { value: 'demo',       label: 'Demo' },
]

export function Musicas({ tracks }: Props) {
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying    = usePlayerStore(s => s.isPlaying)

  useEffect(() => {
    if (tracks.length > 0) {
      usePlayerStore.getState().setQueue(tracks, 0)
    }
  }, [tracks])

  const { active, setActive, visibleTracks } = useFilter(tracks)

  async function handlePlay(track: Track) {
    if (currentTrack?.id === track.id) {
      await audioService.togglePlay()
    } else {
      // Atualiza a fila com as faixas visíveis e toca a selecionada
      const idx = visibleTracks.findIndex(t => t.id === track.id)
      await audioService.setQueueAndPlay(visibleTracks, idx)
    }
  }

  return (
    <section id="musicas" className="pt-[120px] bg-bg-base">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
            Portfólio
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15] mb-4">
            Composições em <span className="bg-grad-main bg-clip-text text-transparent">destaque</span>
          </h2>
          <p className="text-text-secondary max-w-[520px] mx-auto">
            Clique para ouvir. Gravações e composições instrumentais originais.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setActive(f.value)}
              className={`px-5 py-2 rounded-[20px] text-sm font-medium border transition-all
                ${active === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated text-text-secondary border-[rgba(255,255,255,0.07)] hover:bg-accent hover:text-white hover:border-accent'
                }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-0.5">
          {tracks.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">Nenhuma faixa cadastrada.</p>
          ) : (
            visibleTracks.map(track => (
              <MusicaCard
                key={track.id}
                musica={track}
                isActive={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={() => handlePlay(track)}
              />
            ))
          )}
        </div>

        <Player />
      </div>
    </section>
  )
}
