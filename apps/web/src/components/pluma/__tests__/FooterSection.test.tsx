import { render, screen } from '@testing-library/react'
import { FooterSection } from '../FooterSection'

describe('FooterSection', () => {
  beforeEach(() => {
    render(<FooterSection />)
  })

  it('renders "Pluma" text in the footer', () => {
    // Requirement 8.2
    expect(screen.getByText('Pluma')).toBeInTheDocument()
  })

  it('renders navigation link to #hero', () => {
    // Requirement 8.3
    const link = screen.getByRole('link', { name: 'Início' })
    expect(link).toHaveAttribute('href', '#hero')
  })

  it('renders navigation link to #features', () => {
    // Requirement 8.3
    const link = screen.getByRole('link', { name: 'Por que Pluma' })
    expect(link).toHaveAttribute('href', '#features')
  })

  it('renders navigation link to #chat', () => {
    // Requirement 8.3
    const link = screen.getByRole('link', { name: 'Pluma Answers' })
    expect(link).toHaveAttribute('href', '#chat')
  })

  it('renders navigation link to #security', () => {
    // Requirement 8.3
    const link = screen.getByRole('link', { name: 'Segurança' })
    expect(link).toHaveAttribute('href', '#security')
  })

  it('renders navigation link to #cta', () => {
    // Requirement 8.3
    const link = screen.getByRole('link', { name: 'Experimente' })
    expect(link).toHaveAttribute('href', '#cta')
  })

  it('"Política de Privacidade" link opens in a new tab with noopener noreferrer', () => {
    // Requirement 8.4
    const link = screen.getByRole('link', { name: 'Política de Privacidade' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('"Termos de Uso" link opens in a new tab with noopener noreferrer', () => {
    // Requirement 8.4
    const link = screen.getByRole('link', { name: 'Termos de Uso' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
