'use client'

import { useEffect, useState } from 'react'
import { getArtistTestimonials } from '@/services/artistService'
import type { ArtistTestimonial } from '@hub-musico/types'

export function Depoimentos() {
  const [depoimentos, setDepoimentos] = useState<ArtistTestimonial[]>([])

  useEffect(() => {
    getArtistTestimonials()
      .then(setDepoimentos)
      .catch(err => console.error('Depoimentos: erro ao carregar depoimentos', err))
  }, [])

  return (
    <section className="py-[120px] bg-bg-surface">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase text-accent mb-3">
            Clientes
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]">
            O que dizem <span className="bg-grad-main bg-clip-text text-transparent">sobre mim</span>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {depoimentos.map(dep => (
            <div key={dep.id}
              className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-7
                hover:border-[rgba(108,99,255,0.35)] hover:translate-y-[-4px]
                hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all">
              <div className="text-[#ffd700] tracking-[2px] mb-4">★★★★★</div>
              <p className="text-[0.9rem] text-text-secondary leading-[1.7] mb-5 italic">{dep.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center
                  text-xs font-bold text-white flex-shrink-0"
                  style={{ background: dep.gradient }}>
                  {dep.initials}
                </div>
                <div>
                  <strong className="block text-sm mb-0.5">{dep.author}</strong>
                  <span className="text-xs text-text-muted">{dep.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
