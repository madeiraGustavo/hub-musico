'use client'

import type { Artist } from '@hub-musico/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  artist: Artist
}

export function HeroTattoo({ artist }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-10 pt-[80px] pb-20"
      style={{ background: 'var(--profile-bg-base, #0d0d0d)' }}>

      {/* Background sutil */}
      <div className="absolute inset-0 opacity-[0.03]
        bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.5)_0px,rgba(255,255,255,0.5)_1px,transparent_1px,transparent_60px)]" />

      <div className="relative z-10 max-w-[680px]">
        <p style={{ color: 'var(--profile-accent)' }}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase mb-5">
          <span style={{ color: 'var(--profile-accent)' }}
            className="inline-block w-6 h-0.5 rounded-sm" />
          {config.heroTag}
        </p>

        <h1 className="font-head text-[clamp(2.8rem,6vw,5rem)] font-bold leading-[1.08] tracking-[-0.02em] mb-6"
          style={{ color: 'var(--profile-text)' }}>
          {config.heroTitle}<br />
          <GradientText gradient="var(--profile-gradient)">{config.heroSubtitle}</GradientText>
        </h1>

        <p className="text-[1.1rem] max-w-[520px] mb-10 leading-[1.7]"
          style={{ color: 'var(--profile-text-secondary)' }}>
          {artist.tagline}
        </p>

        <div className="flex gap-4 flex-wrap mb-14">
          <a href="#portfolio"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-[32px] font-semibold text-sm transition-all hover:translate-y-[-2px]"
            style={{
              background:  'var(--profile-gradient)',
              color:       '#000',
              boxShadow:   '0 4px 20px rgba(255,255,255,0.15)',
            }}>
            {config.heroCTA}
          </a>
          <a href="#contato"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-[32px] font-semibold text-sm transition-all"
            style={{
              border:  '1px solid var(--profile-accent-border)',
              color:   'var(--profile-text)',
            }}>
            {config.heroSecondaryCTA}
          </a>
        </div>

        <div className="flex gap-10 flex-wrap">
          {artist.stats.map(stat => (
            <div key={stat.label} className="flex flex-col gap-1">
              <GradientText gradient="var(--profile-gradient)" className="font-head text-[2rem] font-bold">
                {stat.value}
              </GradientText>
              <span className="text-[0.8rem] uppercase tracking-[0.06em]"
                style={{ color: 'var(--profile-text-secondary)' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
