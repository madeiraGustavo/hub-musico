'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Static Data ─── */

const METRICS = [
  { value: 300, suffix: '+', label: 'Projetos Entregues' },
  { value: 500, suffix: '+', label: 'Clientes Atendidos' },
  { value: 10, suffix: '+', label: 'Anos de Experiência' },
]

const TESTIMONIALS = [
  {
    rating: 5,
    text: 'Excelente qualidade nos toldos e coberturas. Atendimento profissional do início ao fim. Recomendo para qualquer projeto comercial ou residencial.',
    author: 'Carlos Mendes',
    role: 'Proprietário, Restaurante Vila Nova',
  },
]

/* ─── Count-Up Hook ─── */

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!trigger) return

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReduced) {
      setValue(target)
      return
    }

    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, trigger])

  return value
}

/* ─── Metric Card ─── */

function MetricCard({
  value,
  suffix,
  label,
  inView,
}: {
  value: number
  suffix: string
  label: string
  inView: boolean
}) {
  const displayValue = useCountUp(value, 1500, inView)

  return (
    <div
      className="flex flex-col items-center justify-center p-6 rounded-lg text-center"
      style={{
        backgroundColor: 'var(--mp-bg-dark)',
        color: 'var(--mp-text-on-dark)',
      }}
    >
      <span
        className="text-4xl font-bold"
        style={{ fontFamily: 'var(--mp-font-heading)' }}
        aria-label={`${value}${suffix}`}
      >
        {displayValue}
        {suffix}
      </span>
      <span
        className="mt-2 text-sm"
        style={{ color: 'var(--mp-text-muted)' }}
      >
        {label}
      </span>
    </div>
  )
}

/* ─── Star Rating ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`Avaliação: ${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill={i < rating ? 'var(--mp-accent)' : 'none'}
          stroke={i < rating ? 'var(--mp-accent)' : 'var(--mp-text-muted)'}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.26 5.06 16.7l.94-5.49-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

/* ─── Main Component ─── */

export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="mp-section" aria-labelledby="social-proof-heading">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        {/* 2-column layout: text left, metrics right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left column: About text */}
          <div>
            <h2 id="social-proof-heading" className="mp-heading-2">
              Sobre Nós
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: 'var(--mp-text-secondary)' }}
            >
              Somos especialistas em toldos, coberturas e lonas sob medida. Com mais de uma
              década de experiência, atendemos projetos comerciais e residenciais em toda São
              Paulo, sempre com foco em qualidade, durabilidade e acabamento impecável.
            </p>
            <a
              href="/marketplace#categorias"
              className="inline-flex items-center gap-1 mt-6 text-sm font-semibold"
              style={{ color: 'var(--mp-text-accent)' }}
            >
              Saiba mais
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </a>
          </div>

          {/* Right column: Metrics grid */}
          <div className="grid grid-cols-2 gap-4">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric.label}
                value={metric.value}
                suffix={metric.suffix}
                label={metric.label}
                inView={inView}
              />
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.author}
              className="mp-card p-8"
              style={{ maxWidth: '640px' }}
            >
              <StarRating rating={testimonial.rating} />
              <blockquote
                className="mt-4 text-base italic leading-relaxed"
                style={{ color: 'var(--mp-text-secondary)' }}
              >
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>
              <div className="mt-4">
                <span
                  className="font-semibold text-sm"
                  style={{ color: 'var(--mp-text-default)' }}
                >
                  {testimonial.author}
                </span>
                <span
                  className="ml-2 text-sm"
                  style={{ color: 'var(--mp-text-muted)' }}
                >
                  {testimonial.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
