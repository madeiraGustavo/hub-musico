import { render, screen } from '@testing-library/react'
import { HeroSection } from '../HeroSection'

describe('HeroSection', () => {
  beforeEach(() => {
    render(<HeroSection />)
  })

  it('renders eyebrow text "ASSISTENTE FINANCEIRO COM IA"', () => {
    // Requirement 3.1
    expect(screen.getByText('ASSISTENTE FINANCEIRO COM IA')).toBeInTheDocument()
  })

  it('renders an H1 element', () => {
    // Requirement 3.2
    const h1 = document.querySelector('h1')
    expect(h1).toBeInTheDocument()
  })

  it('renders CTA link with text "Teste grátis por 14 dias"', () => {
    // Requirement 3.4
    expect(screen.getByText('Teste grátis por 14 dias')).toBeInTheDocument()
  })

  it('CTA link points to /register', () => {
    // Requirement 3.4
    const link = screen.getByRole('link', { name: 'Teste grátis por 14 dias' })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('product mockup div has aria-hidden="true"', () => {
    // Requirement 3.5 — no external image URLs, decorative element is hidden from AT
    const mockup = document.querySelector('[aria-hidden="true"]')
    expect(mockup).toBeInTheDocument()
  })
})
