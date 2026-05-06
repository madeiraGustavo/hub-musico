'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Artist, PortfolioItem } from '@hub-musico/types'

interface Props {
  artist: Artist
}

const STYLES = ['Todos', 'Fine Line', 'Blackwork', 'Pontilhismo', 'Geométrico', 'Minimalista', 'Floral']

function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-sm"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Overlay on hover */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
          }}
        >
          <span
            className="text-xs font-semibold tracking-[0.12em] uppercase mb-1"
            style={{ color: '#c9a96e' }}
          >
            {item.style}
          </span>
          <span className="text-sm font-medium" style={{ color: '#f5f5f5' }}>
            {item.alt}
          </span>
          <div className="flex items-center gap-1 mt-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="#c9a96e" stroke="none"/>
            </svg>
            <span className="text-[0.7rem]" style={{ color: '#c9a96e' }}>Ver no Instagram</span>
          </div>
        </div>
      </div>
    </a>
  )
}

// Placeholder card para quando não há imagens
function PlaceholderCard({ index }: { index: number }) {
  const heights = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]']
  const h = heights[index % heights.length]
  return (
    <div
      className={`relative ${h} rounded-sm flex items-center justify-center`}
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(201,169,110,0.1)',
      }}
    >
      <span className="text-3xl opacity-10" style={{ color: '#c9a96e' }}>✦</span>
    </div>
  )
}

export function PortfolioTattoo({ artist }: Props) {
  const portfolio = artist.portfolio ?? []
  const [activeStyle, setActiveStyle] = useState('Todos')

  const filtered = activeStyle === 'Todos'
    ? portfolio
    : portfolio.filter(p => p.style === activeStyle)

  return (
    <section id="portfolio" style={{ background: '#0d0d0d', padding: '120px 0' }}>
      <div className="max-w-[1200px] mx-auto px-8">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="block w-6 h-px" style={{ background: '#c9a96e' }} />
            <span
              className="text-[0.7rem] font-bold tracking-[0.2em] uppercase"
              style={{ color: '#c9a96e' }}
            >
              Galeria
            </span>
          </div>
          <h2
            className="font-head font-bold leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#f5f5f5' }}
          >
            Trabalhos em{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              destaque
            </span>
          </h2>
        </div>

        {/* Style filters */}
        {portfolio.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {STYLES.map(style => (
              <button
                key={style}
                onClick={() => setActiveStyle(style)}
                className="px-4 py-1.5 rounded-sm text-xs font-medium tracking-wide transition-all"
                style={
                  activeStyle === style
                    ? {
                        background: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                        color: '#0d0d0d',
                        border: '1px solid transparent',
                      }
                    : {
                        background: 'transparent',
                        color: '#666',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }
                }
              >
                {style}
              </button>
            ))}
          </div>
        )}

        {/* Grid — masonry-like with CSS columns */}
        {portfolio.length > 0 ? (
          <div className="columns-3 gap-3 max-md:columns-2 max-sm:columns-1 space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="break-inside-avoid mb-3">
                <PortfolioCard item={item} />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm col-span-3 text-center py-12" style={{ color: '#555' }}>
                Nenhum trabalho neste estilo ainda.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <PlaceholderCard key={i} index={i} />
            ))}
          </div>
        )}

        {/* Bottom note */}
        <div className="text-center mt-14">
          <p className="text-sm" style={{ color: '#555' }}>
            Mais de 800 trabalhos realizados
          </p>
        </div>

      </div>
    </section>
  )
}
