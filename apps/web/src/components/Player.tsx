'use client'

import type { PlayerState, PlayerControls } from '@/hooks/usePlayer'

interface Props {
  state: PlayerState
  controls: PlayerControls
  visibleIds: number[]
}

export function Player({ state, controls, visibleIds }: Props) {
  const { currentId, isPlaying, progress, currentTime, totalTime, title, genre } = state

  return (
    <div className="sticky bottom-0 mt-8 bg-[rgba(17,17,24,0.95)] backdrop-blur-2xl border border-[rgba(255,255,255,0.07)]
      rounded-t-lg px-6 py-4 grid grid-cols-[200px_1fr_2fr_160px] items-center gap-6
      shadow-[0_-8px_40px_rgba(0,0,0,0.5)] z-[100]
      max-lg:grid-cols-[1fr_auto] max-lg:grid-rows-[auto_auto]">

      {/* Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-sm bg-grad-main flex items-center justify-center text-xl flex-shrink-0">
          ♪
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{currentId === -1 ? '—' : title}</div>
          <div className="text-xs text-text-muted uppercase tracking-[0.06em]">{currentId === -1 ? '—' : genre}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => controls.prev(visibleIds)} aria-label="Anterior"
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
          ⏮
        </button>
        <button
          onClick={() => currentId === -1 ? controls.play(0) : controls.togglePlay()}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          className="w-11 h-11 rounded-full bg-grad-main text-white flex items-center justify-center
            shadow-[0_4px_16px_rgba(108,99,255,0.4)] hover:scale-[1.08] hover:shadow-[0_6px_24px_rgba(108,99,255,0.55)] transition-all">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => controls.next(visibleIds)} aria-label="Próxima"
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
          ⏭
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2.5 max-lg:col-span-2">
        <span className="text-xs text-text-muted tabular-nums min-w-[32px]">{currentTime}</span>
        <button
          className="flex-1 h-1 bg-bg-elevated rounded-sm cursor-pointer relative overflow-hidden"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            controls.seek((e.clientX - rect.left) / rect.width)
          }}
          aria-label="Barra de progresso"
        >
          <div
            className="h-full bg-grad-main rounded-sm transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </button>
        <span className="text-xs text-text-muted tabular-nums min-w-[32px]">{totalTime}</span>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 max-lg:hidden">
        <span className="text-sm">🔊</span>
        <input
          type="range" min={0} max={1} step={0.01} defaultValue={0.8}
          onChange={e => controls.setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 accent-accent cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
