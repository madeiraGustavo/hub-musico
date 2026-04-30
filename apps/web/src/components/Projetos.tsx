'use client'

import { useEffect, useRef } from 'react'
import { PROJETOS } from '@/lib/data'
import type { Projeto } from '@/types'

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 11.28a.625.625 0 0 1-.86.208c-2.353-1.438-5.314-1.763-8.802-.966a.625.625 0 1 1-.278-1.219c3.818-.872 7.094-.497 9.732 1.117a.625.625 0 0 1 .208.86zm1.223-2.72a.781.781 0 0 1-1.074.257c-2.693-1.655-6.796-2.135-9.983-1.168a.781.781 0 0 1-.453-1.494c3.641-1.105 8.17-.57 11.253 1.33a.781.781 0 0 1 .257 1.075zm.105-2.831C14.692 5.95 9.375 5.775 6.227 6.72a.937.937 0 1 1-.543-1.794c3.609-1.094 9.607-.882 13.396 1.394a.938.938 0 0 1-.966 1.609z"/>
    </svg>
  )
}

interface ProjetoCardProps {
  projeto: Projeto
}

function ProjetoCard({ projeto }: ProjetoCardProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  // Carrega capa do Spotify via oEmbed
  useEffect(() => {
    if (!projeto.spotifyId || !linkRef.current) return
    const el = linkRef.current
    const url = `https://open.spotify.com/album/${projeto.spotifyId}`
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then((data: { thumbnail_url?: string }) => {
        if (data.thumbnail_url && el) {
          el.style.backgroundImage    = `url(${data.thumbnail_url})`
          el.style.backgroundSize     = 'cover'
          el.style.backgroundPosition = 'center'
        }
      })
      .catch(() => {/* mantém gradiente de fallback */})
  }, [projeto.spotifyId])

  const bgStyle: React.CSSProperties = projeto.thumbnailUrl
    ? {
        backgroundImage:    `url('${projeto.thumbnailUrl}')`,
        backgroundSize:     projeto.backgroundSize ?? 'cover',
        backgroundPosition: projeto.backgroundPosition ?? 'center center',
        backgroundRepeat:   'no-repeat',
      }
    : { background: projeto.backgroundStyle }

  return (
    <div className={`group rounded-lg overflow-hidden transition-all
      hover:translate-y-[-4px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]
      ${projeto.featured ? 'row-span-2' : ''}`}
    >
      <a
        ref={linkRef}
        href={projeto.href}
        target="_blank"
        rel="noopener noreferrer"
        style={bgStyle}
        className={`block relative overflow-hidden cursor-pointer w-full h-full
          ${projeto.featured ? 'aspect-[4/3]' : 'aspect-video'}`}
      >
        {/* Overlay base */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(108,99,255,0.35),rgba(0,0,0,0.35))]
          group-hover:bg-[linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,0,0,0.5))] transition-all" />

        {/* Botão play centralizado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1]
          w-14 h-14 rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-sm
          border-2 border-[rgba(255,255,255,0.5)]
          flex items-center justify-center text-white text-lg transition-all
          group-hover:bg-[#6c63ff] group-hover:border-[#6c63ff]
          group-hover:shadow-[0_0_28px_rgba(108,99,255,0.7)]">
          {projeto.platform === 'spotify' ? <SpotifyIcon /> : '▶'}
        </div>

        {/* Overlay de texto no hover */}
        <div className="absolute inset-0 z-[2]
          bg-[linear-gradient(to_top,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.15)_55%,transparent_100%)]
          p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all">
          <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[rgba(255,255,255,0.7)] mb-2">
            {projeto.year}
          </span>
          <h3 className="font-head text-lg font-bold mb-2">{projeto.title}</h3>
          <p className="text-sm text-[rgba(255,255,255,0.8)] mb-3 leading-[1.5]">{projeto.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {projeto.tags.map(tag => (
              <span key={tag}
                className="px-2.5 py-1 bg-[rgba(255,255,255,0.15)] backdrop-blur-sm rounded-xl text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    </div>
  )
}

export function Projetos() {
  return (
    <section id="projetos" className="py-[120px] bg-bg-surface">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
            Trabalhos
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]">
            Projetos <span className="bg-grad-main bg-clip-text text-transparent">recentes</span>
          </h2>
        </div>

        {/* Grid: coluna esquerda = featured (row-span-2), coluna direita = 2 cards empilhados */}
        <div className="grid grid-cols-2 grid-rows-2 gap-5 max-md:grid-cols-1 max-md:grid-rows-none">
          {PROJETOS.map(projeto => (
            <ProjetoCard key={projeto.id} projeto={projeto} />
          ))}
        </div>

      </div>
    </section>
  )
}
