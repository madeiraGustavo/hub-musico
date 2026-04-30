'use client'

import { useEffect, useState } from 'react'
import { getArtistServices } from '@/services/artistService'
import type { ArtistService } from '@hub-musico/types'

const ICONS: Record<ArtistService['icon'], React.ReactNode> = {
  drum: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="9" rx="8" ry="3"/>
      <path d="M4 9v6c0 1.66 3.58 3 8 3s8-1.34 8-3V9"/>
      <line x1="9" y1="21" x2="9" y2="15"/>
      <line x1="15" y1="21" x2="15" y2="15"/>
      <line x1="6" y1="22" x2="12" y2="21"/>
      <line x1="18" y1="22" x2="12" y2="21"/>
    </svg>
  ),
  mic: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10a7 7 0 0 1-14 0"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  ),
  music: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  compose: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
}

export function Servicos() {
  const [servicos, setServicos] = useState<ArtistService[]>([])

  useEffect(() => {
    getArtistServices()
      .then(setServicos)
      .catch(err => console.error('Servicos: erro ao carregar serviços', err))
  }, [])

  return (
    <section id="servicos" className="py-[120px] bg-bg-base">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
            O que ofereço
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]">
            Serviços <span className="bg-grad-main bg-clip-text text-transparent">disponíveis</span>
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {servicos.map(servico => (
            <div key={servico.id}
              className={`relative rounded-lg p-8 border transition-all hover:translate-y-[-4px]
                ${servico.highlight
                  ? 'bg-[linear-gradient(135deg,rgba(108,99,255,0.1),rgba(224,64,251,0.05))] border-[rgba(108,99,255,0.35)] shadow-[0_0_32px_rgba(108,99,255,0.1)]'
                  : 'bg-bg-card border-[rgba(255,255,255,0.07)] hover:border-[rgba(108,99,255,0.35)] hover:shadow-[0_0_40px_rgba(108,99,255,0.25)]'
                }`}
            >
              {servico.highlight && (
                <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-grad-main text-white
                  text-[0.7rem] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-xl">
                  Popular
                </div>
              )}
              <div className="w-[52px] h-[52px] flex items-center justify-center bg-accent-dim
                border border-[rgba(108,99,255,0.35)] rounded-md mb-5 text-accent transition-all
                hover:bg-[linear-gradient(135deg,rgba(108,99,255,0.25),rgba(224,64,251,0.15))]">
                {ICONS[servico.icon]}
              </div>
              <h3 className="font-head text-[1.1rem] font-bold mb-3">{servico.title}</h3>
              <p className="text-[0.875rem] text-text-secondary leading-[1.65] mb-4">{servico.description}</p>
              <ul className="mb-5 space-y-1">
                {servico.items.map(item => (
                  <li key={item} className="text-[0.8rem] text-text-secondary pl-4 relative
                    before:content-['✓'] before:absolute before:left-0 before:text-accent before:text-xs">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="text-[0.85rem] text-text-secondary border-t border-[rgba(255,255,255,0.07)] pt-4">
                {servico.price}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
