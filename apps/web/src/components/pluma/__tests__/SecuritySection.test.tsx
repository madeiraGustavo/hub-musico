import { render, screen } from '@testing-library/react'
import { SecuritySection } from '../SecuritySection'

/**
 * Validates: Requirements 6.2, 6.6
 */

describe('SecuritySection', () => {
  beforeEach(() => {
    render(<SecuritySection />)
  })

  // Requirement 6.2 — Exatamente 4 cards de segurança
  it('renders exactly 4 security cards', () => {
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(4)
  })

  // Requirement 6.6 — Títulos exatos dos cards de segurança
  it('renders "Open Finance certificado pelo Banco Central"', () => {
    expect(
      screen.getByText('Open Finance certificado pelo Banco Central')
    ).toBeInTheDocument()
  })

  it('renders "Mesma segurança que seu internet banking"', () => {
    expect(
      screen.getByText('Mesma segurança que seu internet banking')
    ).toBeInTheDocument()
  })

  it('renders "Seus dados nunca saem do Brasil"', () => {
    expect(
      screen.getByText('Seus dados nunca saem do Brasil')
    ).toBeInTheDocument()
  })

  it('renders "Criptografia de ponta a ponta"', () => {
    expect(
      screen.getByText('Criptografia de ponta a ponta')
    ).toBeInTheDocument()
  })

  // Section id and background class
  it('section has id="security"', () => {
    const section = document.querySelector('section#security')
    expect(section).toBeInTheDocument()
  })

  it('section has bg-[#EBE8D8] class (cream background)', () => {
    const section = document.querySelector('section#security')
    expect(section).toHaveClass('bg-[#EBE8D8]')
  })
})
