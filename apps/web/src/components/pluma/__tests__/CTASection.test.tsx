import { render, screen } from '@testing-library/react'
import { CTASection } from '../CTASection'

describe('CTASection', () => {
  beforeEach(() => {
    render(<CTASection />)
  })

  it('renders an H2 element', () => {
    // Requirement 7.2
    const h2 = document.querySelector('h2')
    expect(h2).toBeInTheDocument()
  })

  it('renders at least 3 benefit list items', () => {
    // Requirement 7.3
    const items = document.querySelectorAll('li')
    expect(items.length).toBeGreaterThanOrEqual(3)
  })

  it('every benefit item text starts with "✓"', () => {
    // Requirement 7.3
    const items = document.querySelectorAll('li')
    items.forEach((item) => {
      expect(item.textContent).toMatch(/^✓/)
    })
  })

  it('CTA link has href="/register"', () => {
    // Requirement 7.8
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/register')
  })

  it('CTA button has transition-colors and duration-300 classes', () => {
    // Requirement 7.5
    const link = screen.getByRole('link')
    expect(link).toHaveClass('transition-colors')
    expect(link).toHaveClass('duration-300')
  })
})
