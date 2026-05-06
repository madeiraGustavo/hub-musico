'use client'

import type { ArtistService, ArtistType } from '@hub-musico/types'
import type { ProfileConfig } from '@/lib/profile/profileConfig'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

const ICONS: Record<ArtistService['icon'], React.ReactNode> = {
  drum: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v6c0 1.66 3.58 3 8 3s8-1.34 8-3V9"/><line x1="9" y1="21" x2="9" y2="15"/><line x1="15" y1="21" x2="15" y2="15"/><line x1="6" y1="22" x2="12" y2="21"/><line x1="18" y1="22" x2="12" y2="21"/></svg>),
  mic: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>),
  music: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>),
  compose: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>),
  needle: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7H9l3-7z"/><line x1="12" y1="9" x2="12" y2="22"/><path d="M9 16c1 1 3 1.5 3 1.5s2-.5 3-1.5"/></svg>),
  camera: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>),
  calendar: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  star: (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
}

interface Props {
  services:    ArtistService[]
  profileType?: ArtistType
  palette?:    ProfileConfig['palette']
}

export function Servicos({
  services,
  profileType = 'musician',
  palette     = PROFILE_CONFIG.musician.palette,
}: Props) {
  const id = `servicos-${profileType}`

  return (
    <section id="servicos" style={{ background: palette.bgBase, padding: '120px 0' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        #${id} .servico-card { background: ${palette.bgCard}; border: 1px solid ${palette.accentBorder}; transition: transform 0.25s, box-shadow 0.25s; }
        #${id} .servico-card:hover { transform: translateY(-4px); box-shadow: 0 0 40px ${palette.accentDim}; border-color: ${palette.accent}; }
        #${id} .servico-card.highlight { background: ${palette.accentDim}; border-color: ${palette.accent}; }
        #${id} .servico-icon { background: ${palette.accentDim}; border: 1px solid ${palette.accentBorder}; color: ${palette.accent}; }
      ` }} />

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
            style={{ color: palette.accent }}>
            O que ofereço
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]"
            style={{ color: palette.text }}>
            Serviços{' '}
            <GradientText gradient={palette.gradient}>disponíveis</GradientText>
          </h2>
        </div>

        <div id={id} className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {services.map(servico => (
            <div key={servico.id}
              className={`servico-card relative rounded-lg p-8 flex flex-col ${servico.highlight ? 'highlight' : ''}`}>
              {servico.highlight && (
                <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 text-[0.7rem] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-xl"
                  style={{ background: palette.gradient, color: palette.bgBase }}>
                  Popular
                </div>
              )}
              <div className="servico-icon w-[52px] h-[52px] flex items-center justify-center rounded-md mb-5">
                {ICONS[servico.icon]}
              </div>
              <h3 className="font-head text-[1.1rem] font-bold mb-3" style={{ color: palette.text }}>
                {servico.title}
              </h3>
              <p className="text-[0.875rem] leading-[1.65] mb-4 min-h-[72px]" style={{ color: palette.textSecondary }}>
                {servico.description}
              </p>
              <ul className="mb-5 space-y-2 flex-1">
                {servico.items.map(item => (
                  <li key={item} className="text-[0.8rem] flex items-start gap-1.5"
                    style={{ color: palette.textSecondary }}>
                    <span style={{ color: palette.accent }} className="flex-shrink-0 text-xs mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="text-[0.85rem] pt-4 mt-auto"
                style={{ borderTop: `1px solid ${palette.accentBorder}`, color: palette.textSecondary }}>
                {servico.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
