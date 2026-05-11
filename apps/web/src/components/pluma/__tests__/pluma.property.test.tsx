/**
 * Pluma Landing Page — Correctness Properties
 *
 * All 10 properties from the design document.
 * Configuration: fc.configureGlobal({ numRuns: 100 })
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import fc from 'fast-check'

// Mock next/font/google — required for components that import Anton
vi.mock('next/font/google', () => ({
  Anton: () => ({ variable: '--font-anton', className: 'mock-anton' }),
}))

import { PROMPT_PILLS, ChatSection } from '../ChatSection'
import { SECURITY_ITEMS } from '../SecuritySection'
import { BENEFITS } from '../CTASection'
import { NAV_SECTIONS, LEGAL_LINKS, FooterSection } from '../FooterSection'
import { PlumaLayout } from '../PlumaLayout'

// ---------------------------------------------------------------------------
// Global fast-check configuration
// ---------------------------------------------------------------------------
beforeAll(() => {
  fc.configureGlobal({ numRuns: 100 })
})

// ---------------------------------------------------------------------------
// WCAG contrast helpers (pure functions — no DOM needed)
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return [r, g, b]
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const rs = linearize(r / 255)
  const gs = linearize(g / 255)
  const bs = linearize(b / 255)
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

describe('Pluma Landing Page — Correctness Properties', () => {

  // Feature: pluma-landing-page, Property 1: Prompt pill click fills input
  it('Property 1: clicking any prompt pill fills the input with exactly that pill text', () => {
    // Validates: Requirements 5.6
    fc.assert(
      fc.property(fc.constantFrom(...PROMPT_PILLS), (pill) => {
        const { unmount } = render(<ChatSection />)

        const pillButton = screen.getByRole('button', { name: pill })
        fireEvent.click(pillButton)

        const input = screen.getByRole('textbox') as HTMLInputElement
        expect(input.value).toBe(pill)

        unmount()
      })
    )
  })

  // Feature: pluma-landing-page, Property 2: Security card content length invariant
  it('Property 2: every security card title ≤ 60 chars and description ≤ 120 chars', () => {
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: SECURITY_ITEMS.length - 1 }),
        (index) => {
          const item = SECURITY_ITEMS[index]
          if (!item) return
          expect(item.title.length).toBeLessThanOrEqual(60)
          expect(item.description.length).toBeLessThanOrEqual(120)
        }
      )
    )
  })

  // Feature: pluma-landing-page, Property 3: CTA benefit list invariant
  it('Property 3: benefit list has ≥ 3 items and every item starts with ✓', () => {
    // Validates: Requirements 7.3
    // BENEFITS is a static array — we verify the invariant holds for every element
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: BENEFITS.length - 1 }),
        (index) => {
          expect(BENEFITS.length).toBeGreaterThanOrEqual(3)
          const benefit = BENEFITS[index]
          if (!benefit) return
          expect(benefit).toMatch(/^✓/)
        }
      )
    )
  })

  // Feature: pluma-landing-page, Property 4: Footer navigation completeness
  it('Property 4: every nav section has a corresponding anchor link in the rendered footer', () => {
    // Validates: Requirements 8.3
    const { unmount } = render(<FooterSection />)

    fc.assert(
      fc.property(fc.constantFrom(...NAV_SECTIONS), (navItem) => {
        const link = document.querySelector(`a[href="${navItem.href}"]`)
        expect(link).not.toBeNull()
      })
    )

    unmount()
  })

  // Feature: pluma-landing-page, Property 5: External links security attributes
  it('Property 5: every legal link has target=_blank and rel=noopener noreferrer', () => {
    // Validates: Requirements 8.4
    const { unmount } = render(<FooterSection />)

    fc.assert(
      fc.property(fc.constantFrom(...LEGAL_LINKS), (legalLink) => {
        const link = document.querySelector(`a[href="${legalLink.href}"]`) as HTMLAnchorElement | null
        expect(link).not.toBeNull()
        expect(link!.getAttribute('target')).toBe('_blank')
        expect(link!.getAttribute('rel')).toBe('noopener noreferrer')
      })
    )

    unmount()
  })

  // Feature: pluma-landing-page, Property 6: WCAG color contrast compliance
  it('Property 6: all color pairs meet WCAG 2.1 AA contrast thresholds', () => {
    // Validates: Requirements 6.4, 7.6, 8.5
    const COLOR_PAIRS: [string, string, number][] = [
      ['#050706', '#EBE8D8', 4.5], // Security section text on cream
      ['#EBE8D8', '#050706', 4.5], // Footer text on black
      ['#FFFFFF', '#1C3F3A', 4.5], // CTA/Chat text on dark green
      ['#FFFFFF', '#2E8F86', 3.0], // White on teal (large text / button)
    ]

    fc.assert(
      fc.property(fc.constantFrom(...COLOR_PAIRS), ([fg, bg, threshold]) => {
        const ratio = contrastRatio(fg, bg)
        expect(ratio).toBeGreaterThanOrEqual(threshold)
      })
    )
  })

  // Feature: pluma-landing-page, Property 7: Semantic HTML structure
  it('Property 7: rendered layout contains all required semantic elements', () => {
    // Validates: Requirements 9.3
    const REQUIRED_TAGS = ['section', 'footer', 'h1', 'h2', 'nav', 'ul', 'li'] as const

    const { container, unmount } = render(<PlumaLayout />)

    fc.assert(
      fc.property(fc.constantFrom(...REQUIRED_TAGS), (tag) => {
        const elements = container.querySelectorAll(tag)
        expect(elements.length).toBeGreaterThan(0)
      })
    )

    unmount()
  })

  // Feature: pluma-landing-page, Property 8: Interactive element keyboard accessibility
  it('Property 8: every interactive element has focus-visible styles', () => {
    // Validates: Requirements 9.4, 3.8, 7.6
    const { container, unmount } = render(<PlumaLayout />)

    const buttons = Array.from(container.querySelectorAll('button'))
    const anchors = Array.from(container.querySelectorAll('a'))
    const interactive = [...buttons, ...anchors]

    expect(interactive.length).toBeGreaterThan(0)

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: interactive.length - 1 }),
        (index) => {
          const el = interactive[index]
          if (!el) return
          const className = el.getAttribute('class') ?? ''
          expect(className).toMatch(/focus-visible/)
        }
      )
    )

    unmount()
  })

  // Feature: pluma-landing-page, Property 9: Decorative SVG has aria-hidden=true
  it('Property 9: every decorative SVG has aria-hidden="true"', () => {
    // Validates: Requirements 9.5
    const { container, unmount } = render(<PlumaLayout />)

    const svgs = Array.from(container.querySelectorAll('svg'))

    // If there are no SVGs, the property holds vacuously
    if (svgs.length === 0) {
      unmount()
      return
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: svgs.length - 1 }),
        (index) => {
          const svg = svgs[index]
          if (!svg) return
          expect(svg.getAttribute('aria-hidden')).toBe('true')
        }
      )
    )

    unmount()
  })

  // Feature: pluma-landing-page, Property 10: Icon-only interactive elements have aria-label
  it('Property 10: every icon-only interactive element has a non-empty aria-label', () => {
    // Validates: Requirements 9.6
    // An "icon-only" element is a button or anchor with no visible text content
    // (trimmed textContent is empty or whitespace-only).
    // If no such elements exist, the test passes vacuously — documented here.
    const { container, unmount } = render(<PlumaLayout />)

    const buttons = Array.from(container.querySelectorAll('button'))
    const anchors = Array.from(container.querySelectorAll('a'))
    const interactive = [...buttons, ...anchors]

    const iconOnly = interactive.filter((el) => {
      const text = el.textContent?.trim() ?? ''
      return text === ''
    })

    // Vacuous pass: no icon-only elements found in the current implementation
    // (all buttons and links have visible text content)
    if (iconOnly.length === 0) {
      unmount()
      return
    }

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: iconOnly.length - 1 }),
        (index) => {
          const el = iconOnly[index]
          if (!el) return
          const ariaLabel = el.getAttribute('aria-label') ?? ''
          expect(ariaLabel.trim().length).toBeGreaterThan(0)
        }
      )
    )

    unmount()
  })
})
