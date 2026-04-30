'use client'

import { useEffect, useRef } from 'react'

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    function resize() {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function draw() {
      if (!canvas || !ctx) return
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      const barCount = Math.floor(width / 6)
      const barW = width / barCount
      for (let i = 0; i < barCount; i++) {
        const x = i * barW
        const f1 = Math.sin((i / barCount) * Math.PI * 4 + t) * 0.5 + 0.5
        const f2 = Math.sin((i / barCount) * Math.PI * 8 + t * 1.3) * 0.3 + 0.3
        const f3 = Math.sin((i / barCount) * Math.PI * 2 + t * 0.7) * 0.2 + 0.2
        const h = ((f1 + f2 + f3) / 3) * height * 0.85 + 4
        const grad = ctx.createLinearGradient(0, height - h, 0, height)
        grad.addColorStop(0, 'rgba(108,99,255,0.8)')
        grad.addColorStop(1, 'rgba(224,64,251,0.3)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(x + 1, height - h, barW - 2, h, [2, 2, 0, 0])
        ctx.fill()
      }
      t += 0.025
      animId = requestAnimationFrame(draw)
    }

    window.addEventListener('resize', resize, { passive: true })
    resize()
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-10 pt-[80px] pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,rgba(108,99,255,0.12)_0%,transparent_70%),radial-gradient(ellipse_50%_40%_at_80%_70%,rgba(224,64,251,0.08)_0%,transparent_60%)]" />

      {/* Waveform */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] opacity-40">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[680px] animate-fade-in">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase text-accent mb-5
          before:content-[''] before:inline-block before:w-6 before:h-0.5 before:bg-accent before:rounded-sm">
          Baterista · Multi-instrumentista · Compositor · Arranjador · Educador Musical
        </p>

        <h1 className="font-head text-[clamp(2.8rem,6vw,5rem)] font-bold leading-[1.08] tracking-[-0.02em] mb-6">
          O ritmo que move<br />
          <span className="bg-grad-main bg-clip-text text-transparent">a sua música</span>
        </h1>

        <p className="text-[1.1rem] text-text-secondary max-w-[520px] mb-10 leading-[1.7]">
          Baterista profissional e multi-instrumentista formado pela Bituca — Universidade de Música Popular.
          Gravações, shows e projetos musicais em Juiz de Fora e em todo o Brasil.
        </p>

        <div className="flex gap-4 flex-wrap mb-14">
          <a href="#musicas" className="inline-flex items-center justify-center px-7 py-3.5 rounded-[32px] bg-grad-main text-white font-semibold text-sm
            shadow-[0_4px_20px_rgba(108,99,255,0.4)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(108,99,255,0.55)] transition-all">
            Ouvir Músicas
          </a>
          <a href="#contato" className="inline-flex items-center justify-center px-7 py-3.5 rounded-[32px] border border-[rgba(255,255,255,0.07)]
            text-text-primary font-semibold text-sm hover:border-accent hover:text-accent hover:bg-accent-dim transition-all">
            Trabalhar Juntos
          </a>
        </div>

        <div className="flex gap-10 flex-wrap">
          {[
            { num: '10+', label: 'Artistas & Bandas' },
            { num: '2',   label: 'Formações Bituca' },
            { num: '6+',  label: 'Anos de Carreira' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="font-head text-[2rem] font-bold bg-grad-main bg-clip-text text-transparent">
                {stat.num}
              </span>
              <span className="text-[0.8rem] text-text-muted uppercase tracking-[0.06em]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
