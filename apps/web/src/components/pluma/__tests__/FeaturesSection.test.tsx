import { render, screen } from '@testing-library/react'
import { FeaturesSection } from '../FeaturesSection'

describe('FeaturesSection', () => {
  beforeEach(() => {
    render(<FeaturesSection />)
  })

  it('renders H2 "Menos planilhas. Mais clareza."', () => {
    // Requirement 4.1
    expect(screen.getByRole('heading', { level: 2, name: 'Menos planilhas. Mais clareza.' })).toBeInTheDocument()
  })

  it('renders exactly 3 feature cards', () => {
    // Requirement 4.2
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)
  })

  it('renders card title "Conecta automaticamente"', () => {
    // Requirement 4.7
    expect(screen.getByRole('heading', { level: 3, name: 'Conecta automaticamente' })).toBeInTheDocument()
  })

  it('renders card title "Experiência personalizada"', () => {
    // Requirement 4.7
    expect(screen.getByRole('heading', { level: 3, name: 'Experiência personalizada' })).toBeInTheDocument()
  })

  it('renders card title "Atualiza sozinho"', () => {
    // Requirement 4.7
    expect(screen.getByRole('heading', { level: 3, name: 'Atualiza sozinho' })).toBeInTheDocument()
  })

  it('renders description for card 1', () => {
    // Requirement 4.7
    expect(
      screen.getByText('Conecta automaticamente todas suas contas via Open Finance do Banco Central.')
    ).toBeInTheDocument()
  })

  it('renders description for card 2', () => {
    // Requirement 4.7
    expect(
      screen.getByText('Responde suas dúvidas em linguagem humana e sugere ações para sua situação real.')
    ).toBeInTheDocument()
  })

  it('renders description for card 3', () => {
    // Requirement 4.7
    expect(
      screen.getByText('Não precisa fazer input manual. Você só conversa e toma decisões.')
    ).toBeInTheDocument()
  })

  it('cards have hover:-translate-y-1 class', () => {
    // Requirement 4.6
    const cards = document.querySelectorAll('.hover\\:-translate-y-1')
    expect(cards.length).toBe(3)
  })

  it('cards have transition-transform class', () => {
    // Requirement 4.6
    const cards = document.querySelectorAll('.transition-transform')
    expect(cards.length).toBe(3)
  })
})
