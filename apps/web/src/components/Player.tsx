'use client'

import { usePlayerStore } from '@/services/audio/usePlayerStore'
import { audioService }   from '@/services/audio/AudioService'

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s === 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export function Player() {
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying    = usePlayerStore(s => s.isPlaying)
  const isLoading    = usePlayerStore(s => s.isLoading)
  const progress     = usePlayerStore(s => s.progress)
  const currentTime  = usePlayerStore(s => s.currentTime)
  const duration     = usePlayerStore(s => s.duration)
  const volume       = usePlayerStore(s => s.volume)
  const repeatMode   = usePlayerStore(s => s.repeatMode)
  const shuffle      = usePlayerStore(s => s.shuffle)

  return (
    <div className="sticky bottom-0 mt-8 bg-[rgba(17,17,24,0.95)] backdrop-blur-2xl
      border border-[rgba(255,255,255,0.07)] rounded-t-lg px-6 py-4
      grid grid-cols-[200px_1fr_2fr_200px] items-center gap-6
      shadow-[0_-8px_40px_rgba(0,0,0,0.5)] z-[100]
      max-lg:grid-cols-[1fr_auto] max-lg:grid-rows-[auto_auto]">

      {/* Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-sm bg-grad-main flex items-center justify-center text-xl flex-shrink-0">
          {isLoading ? (
            <span className="animate-spin text-sm">⟳</span>
          ) : '♪'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">
            {currentTrack?.title ?? '—'}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-[0.06em]">
            {currentTrack?.genreLabel ?? '—'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Shuffle */}
        <button
          onClick={() => usePlayerStore.getState().setShuffle(!shuffle)}
          aria-label="Shuffle"
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors
            ${shuffle ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
          ⇄
        </button>

        <button onClick={() => audioService.prev()} aria-label="Anterior"
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
          ⏮
        </button>

        <button
          onClick={() => audioService.togglePlay()}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          className="w-11 h-11 rounded-full bg-grad-main text-white flex items-center justify-center
            shadow-[0_4px_16px_rgba(108,99,255,0.4)] hover:scale-[1.08] transition-all">
          {isLoading ? <span className="animate-spin text-sm">⟳</span> : isPlaying ? '⏸' : '▶'}
        </button>

        <button onClick={() => audioService.next()} aria-label="Próxima"
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
          ⏭
        </button>

        {/* Repeat */}
        <button
          onClick={() => {
            const modes = ['none', 'all', 'one'] as const
            const idx  = modes.indexOf(repeatMode)
            const next = modes[(idx + 1) % modes.length] ?? 'none'
            usePlayerStore.getState().setRepeat(next)
          }}
          aria-label="Repetir"
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors
            ${repeatMode !== 'none' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}>
          {repeatMode === 'one' ? '↺¹' : '↺'}
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2.5 max-lg:col-span-2">
        <span className="text-xs text-text-muted tabular-nums min-w-[32px]">
          {formatTime(currentTime)}
        </span>
        <button
          className="flex-1 h-1 bg-bg-elevated rounded-sm cursor-pointer relative overflow-hidden group"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            audioService.seek((e.clientX - rect.left) / rect.width)
          }}
          aria-label="Barra de progresso"
        >
          <div
            className="h-full bg-grad-main rounded-sm transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </button>
        <span className="text-xs text-text-muted tabular-nums min-w-[32px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 max-lg:hidden">
        <button
          onClick={() => audioService.setMuted(!usePlayerStore.getState().muted)}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Mute">
          {usePlayerStore(s => s.muted) || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
        </button>
        <input
          type="range" min={0} max={1} step={0.01} value={volume}
          onChange={e => audioService.setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 accent-accent cursor-pointer"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
