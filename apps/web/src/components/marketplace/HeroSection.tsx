'use client'

import Link from 'next/link'
import { HeroSearchBar } from './HeroSearchBar'

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
  categories,
}: HeroSectionProps) {
  return (
    <section
      className="mp-section mp-hero-section"
      style={{
        background: 'linear-gradient(180deg, var(--mp-bg-base) 0%, var(--mp-bg-surface) 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--mp-content-padding)',
          textAlign: 'center',
          width: '100%',
        }}
      >
        {/* Title */}
        <h1
          className="mp-heading-1 mp-fade-in"
          style={{
            marginBottom: '16px',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          className="mp-fade-in-delay-1"
          style={{
            fontFamily: 'var(--mp-font-body)',
            fontSize: '1.125rem',
            color: 'var(--mp-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: '1.6',
          }}
        >
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div
          className="mp-fade-in-delay-2 mp-hero-ctas"
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <Link href={ctaPrimary.href} className="mp-btn-primary">
            {ctaPrimary.label}
          </Link>
          <Link href={ctaSecondary.href} className="mp-btn-secondary">
            {ctaSecondary.label}
          </Link>
        </div>

        {/* Social Proof */}
        {socialProof && (
          <div
            className="mp-fade-in-delay-3 mp-hero-social-proof"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            {/* Overlapping SVG Avatars */}
            <div
              style={{ display: 'flex', marginRight: '-4px' }}
              aria-hidden="true"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                style={{ marginRight: '-8px', position: 'relative', zIndex: 3 }}
              >
                <circle cx="16" cy="16" r="15" fill="#E5E7EB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="16" cy="12" r="5" fill="#9CA3AF" />
                <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#9CA3AF" />
              </svg>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                style={{ marginRight: '-8px', position: 'relative', zIndex: 2 }}
              >
                <circle cx="16" cy="16" r="15" fill="#D1D5DB" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="16" cy="12" r="5" fill="#6B7280" />
                <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#6B7280" />
              </svg>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <circle cx="16" cy="16" r="15" fill="#F3F4F6" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="16" cy="12" r="5" fill="#4B5563" />
                <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="#4B5563" />
              </svg>
            </div>

            <span
              style={{
                fontFamily: 'var(--mp-font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--mp-text-secondary)',
              }}
            >
              {socialProof.count}+ {socialProof.label}
            </span>
          </div>
        )}

        {/* Integrated Search/Filter Bar */}
        {categories && categories.length > 0 && (
          <div
            className="mp-fade-in-delay-3"
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <HeroSearchBar categories={categories} />
          </div>
        )}
      </div>
    </section>
  )
}
