'use client'

import { useEffect, useRef } from 'react'
import type { Track } from '@hub-art/types'

interface Props {
  musica: Track
  isPlaying: boolean
  isActive: boolean
  onPlay: () => void
}

function drawMiniWave(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas
  const bars = 20
  const barW = w / bars
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < bars; i++) {
    const barH = Math.random() * (h * 0.7) + h * 0.15
    const grad = ctx.createLinearGradient(0, h - barH, 0, h)
    grad.addColorStop(0, 'rgba(108,99,255,0.7)')
    grad.addColorStop(1, 'rgba(224,64,251,0.3)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(i * barW + 1, h - barH, barW - 2, barH, [1, 1, 0, 0])
    ctx.fill()
  }
}

export function MusicaCard({ musica, isPlaying, isActive, onPlay }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawMiniWave(canvasRef.current)
  }, [])

  return (
    <div
      className={`grid items-center gap-5 px-5 py-4 rounded-md border transition-all cursor-pointer
        grid-cols-[48px_1fr_auto_auto_auto]
        ${isActive
          ? 'bg-bg-elevated border-accent shadow-[0_0_24px_rgba(108,99,255,0.2)]'
          : 'bg-bg-card border-[rgba(255,255,255,0.07)] hover:bg-bg-elevated hover:border-[rgba(108,99,255,0.35)] hover:translate-x-1'
        }`}
    >
      {/* Play button */}
      <button
        onClick={() => onPlay()}
        aria-label={isActive && isPlaying ? 'Pausar' : 'Reproduzir'}
        className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all flex-shrink-0
          ${isActive
            ? 'bg-accent border-accent shadow-[0_0_20px_rgba(108,99,255,0.4)]'
            : 'bg-accent-dim border-[rgba(108,99,255,0.35)] hover:bg-accent hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]'
          }`}
      >
        <span className={`text-sm leading-none ${isActive ? 'text-white' : 'text-accent'}`}>
          {isActive && isPlaying ? '⏸' : '▶'}
        </span>
      </button>

      {/* Info */}
      <div>
        <h3 className="text-[0.95rem] font-semibold mb-1">{musica.title}</h3>
        <span className="text-xs text-accent font-medium uppercase tracking-[0.06em]">
          {musica.genreLabel}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 text-[0.8rem] text-text-muted text-right min-w-[60px] hidden sm:flex">
        <span>{musica.duration}</span>
        <span>{musica.key}</span>
      </div>

      {/* Waveform */}
      <div className="hidden md:flex items-center">
        <canvas ref={canvasRef} width={120} height={32} />
      </div>

      {/* Action */}
      <div className="min-w-[100px] flex justify-end">
        <a
          href="#contato"
          className="px-3.5 py-1.5 text-xs font-medium rounded-[20px] bg-accent-dim text-accent
            border border-[rgba(108,99,255,0.35)] hover:bg-accent hover:text-white transition-all"
          onClick={e => e.stopPropagation()}
        >
          Licenciar
        </a>
      </div>
    </div>
  )
}
