'use client'

import Link from 'next/link'

export interface HeroSectionProps {
  title: string
  subtitle: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  socialProof?: { count: number; label: string }
  categories?: Array<{ id: string; name: string; slug: string }>
}

export function HeroSection({
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  socialProof,
}: HeroSectionProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'var(--mp-bg-hero)',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Geometric industrial pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(212,160,23,0.3) 60px, rgba(212,160,23,0.3) 61px),
              repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(212,160,23,0.3) 60px, rgba(212,160,23,0.3) 61px)
            `,
          }}
        />
      </div>

      {/* Gold accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: 'var(--mp-accent)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div>
            {/* Badge */}
            <div className="mp-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-6"
              style={{ backgroundColor: 'rgba(212, 160, 23, 0.15)', border: '1px solid rgba(212, 160, 23, 0.3)' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--mp-accent)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--mp-accent)' }}>
                Fabricação Própria
              </span>
            </div>

            {/* Title */}
            <h1
              className="mp-fade-in"
              style={{
                fontFamily: 'var(--mp-font-heading)',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                marginBottom: '20px',
              }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              className="mp-fade-in-delay-1"
              style={{
                fontSize: '1.125rem',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '500px',
                lineHeight: '1.7',
                marginBottom: '32px',
              }}
            >
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="mp-fade-in-delay-2 flex flex-wrap gap-4 mb-8">
              <Link
                href={ctaPrimary.href}
                className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  backgroundColor: 'var(--mp-accent)',
                  color: 'var(--mp-text-on-accent)',
                  borderRadius: 'var(--mp-radius-sm)',
                }}
              >
                {ctaPrimary.label}
              </Link>
              <Link
                href={ctaSecondary.href}
                className="inline-flex items-center justify-center px-8 py-4 font-bold text-sm uppercase tracking-wider border-2 transition-all duration-200 hover:bg-white/10"
                style={{
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: 'var(--mp-radius-sm)',
                }}
              >
                {ctaSecondary.label}
              </Link>
            </div>

            {/* Social Proof / Trust */}
            {socialProof && (
              <div className="mp-fade-in-delay-3 flex items-center gap-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--mp-accent)' }}>{socialProof.count}+</div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>{socialProof.label}</div>
                </div>
                <div className="w-px h-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--mp-accent)' }}>15+</div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>anos no mercado</div>
                </div>
                <div className="w-px h-10 hidden sm:block" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center hidden sm:block">
                  <div className="text-2xl font-bold" style={{ color: 'var(--mp-accent)' }}>100%</div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>sob medida</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Visual placeholder (industrial awning illustration) */}
          <div className="hidden lg:flex items-center justify-center">
            <div
              className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Stylized toldo SVG placeholder */}
              <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
                {/* Structure lines */}
                <line x1="80" y1="350" x2="80" y2="180" stroke="rgba(212,160,23,0.4)" strokeWidth="3" />
                <line x1="320" y1="350" x2="320" y2="180" stroke="rgba(212,160,23,0.4)" strokeWidth="3" />
                {/* Canopy */}
                <path d="M60 180 Q200 120 340 180 L340 200 Q200 160 60 200 Z" fill="rgba(212,160,23,0.2)" stroke="rgba(212,160,23,0.5)" strokeWidth="2" />
                {/* Second layer */}
                <path d="M60 200 Q200 160 340 200 L340 220 Q200 180 60 220 Z" fill="rgba(212,160,23,0.1)" stroke="rgba(212,160,23,0.3)" strokeWidth="1" />
                {/* Ground line */}
                <line x1="40" y1="350" x2="360" y2="350" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                {/* Measurement arrows */}
                <line x1="80" y1="370" x2="320" y2="370" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="200" y="388" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="12" fontFamily="var(--mp-font-body)">sob medida</text>
              </svg>

              {/* Corner accents */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: 'var(--mp-accent)' }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: 'var(--mp-accent)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
