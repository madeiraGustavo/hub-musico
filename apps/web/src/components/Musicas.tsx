'use client'

import { usePlayer } from '@/hooks/usePlayer'
import { useFilter } from '@/hooks/useFilter'
import { MusicaCard } from './MusicaCard'
import { Player } from './Player'
import type { FilterGenre } from '@/types'

const FILTERS: { value: FilterGenre; label: string }[] = [
  { value: 'all',        label: 'Todas' },
  { value: 'piano',      label: 'Piano' },
  { value: 'jazz',       label: 'Jazz' },
  { value: 'ambient',    label: 'Ambient' },
  { value: 'orquestral', label: 'Orquestral' },
  { value: 'rock',       label: 'Rock' },
  { value: 'demo',       label: 'Demo' },
]

export function Musicas() {
  const [playerState, playerControls] = usePlayer()
  const { active, setActive, visibleMusicas, visibleIds } = useFilter()

  return (
    <section id="musicas" className="pt-[120px] bg-bg-base">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Header */}
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

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setActive(f.value)}
              className={`px-5 py-2 rounded-[20px] text-sm font-medium border transition-all
                ${active === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated text-text-secondary border-[rgba(255,255,255,0.07)] hover:bg-accent hover:text-white hover:border-accent'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-0.5">
          {visibleMusicas.map(musica => (
            <MusicaCard
              key={musica.id}
              musica={musica}
              isActive={playerState.currentId === musica.id}
              isPlaying={playerState.isPlaying && playerState.currentId === musica.id}
              onPlay={id => playerControls.play(id)}
            />
          ))}
        </div>

        {/* Player */}
        <Player state={playerState} controls={playerControls} visibleIds={visibleIds} />
      </div>
    </section>
  )
}
