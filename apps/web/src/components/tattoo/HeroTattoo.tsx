'use client'

import type { Artist } from '@hub-musico/types'
import { PROFILE_CONFIG } from '@/lib/profile/profileConfig'

interface Props {
  artist: Artist
}

export function HeroTattoo({ artist }: Props) {
  const config = PROFILE_CONFIG[artist.profileType]
  const ig = artist.social['instagram'] ?? 'martt_atoo'

  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      style={{ background: '#0d0d0d' }}
    >
      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      {/* Subtle ink-bleed radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(201,169,110,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 80% 30%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
      />

      {/* Vertical rule lines — subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 120px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-8 pb-24 pt-[140px] grid grid-cols-[1fr_auto] gap-16 items-end max-lg:grid-cols-1 max-lg:gap-10">

        {/* Left — text */}
        <div>
          {/* Tag */}
          <div className="flex items-center gap-3 mb-8">
            <span
              className="block w-8 h-px"
              style={{ background: '#c9a96e' }}
            />
            <span
              className="text-[0.7rem] font-bold tracking-[0.2em] uppercase"
              style={{ color: '#c9a96e' }}
            >
              {config.heroTag}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-head font-bold leading-[1.0] tracking-[-0.03em] mb-6"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              color: '#f5f5f5',
            }}
          >
            {config.heroTitle}
            <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #c9a96e 0%, #f0d898 50%, #c9a96e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {config.heroSubtitle}
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="text-[1.05rem] max-w-[480px] mb-10 leading-[1.75]"
            style={{ color: '#a0a0a0' }}
          >
            {artist.tagline}
          </p>

          {/* CTAs */}
          <div className="flex gap-4 flex-wrap mb-16">
            <a
              href="#portfolio"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-sm font-semibold text-sm transition-all hover:translate-y-[-2px]"
              style={{
                background: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                color: '#0d0d0d',
                boxShadow: '0 4px 24px rgba(201,169,110,0.3)',
              }}
            >
              {config.heroCTA}
              <span className="text-xs">→</span>
            </a>
            <a
              href={`https://instagram.com/${ig}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-sm font-semibold text-sm transition-all hover:border-[#c9a96e] hover:text-[#c9a96e]"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#f5f5f5',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              @{ig}
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-12 flex-wrap">
            {artist.stats.map((stat, i) => (
              <div key={stat.label} className="flex flex-col gap-1">
                {i > 0 && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 hidden"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  />
                )}
                <span
                  className="font-head text-[2.2rem] font-bold leading-none"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #c9a96e, #f0d898)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-[0.72rem] uppercase tracking-[0.1em]"
                  style={{ color: '#666' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — decorative needle/ink element */}
        <div className="flex flex-col items-center gap-3 max-lg:hidden">
          <div
            className="w-px flex-1 min-h-[200px]"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(201,169,110,0.4), transparent)' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: '#c9a96e', boxShadow: '0 0 12px rgba(201,169,110,0.6)' }}
          />
          <div
            className="w-px h-16"
            style={{ background: 'linear-gradient(to bottom, rgba(201,169,110,0.4), transparent)' }}
          />
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #0d0d0d, transparent)' }}
      />
    </section>
  )
}
