import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '../EmptyState'

// Mock next/link to render a simple anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('EmptyState', () => {
  it('renders cart variant with correct icon, title, and description', () => {
    render(
      <EmptyState
        icon="cart"
        title="Carrinho vazio"
        description="Adicione produtos ao seu carrinho"
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Carrinho vazio')
    expect(screen.getByText('Adicione produtos ao seu carrinho')).toBeInTheDocument()
    // SVG icon should be present and hidden from screen readers
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '80')
    expect(svg).toHaveAttribute('height', '80')
  })

  it('renders search variant with SVG icon', () => {
    render(
      <EmptyState
        icon="search"
        title="Nenhum resultado"
        description="Tente buscar por outro termo"
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Nenhum resultado')
    expect(screen.getByText('Tente buscar por outro termo')).toBeInTheDocument()
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('renders category variant with SVG icon', () => {
    render(
      <EmptyState
        icon="category"
        title="Categoria vazia"
        description="Explore outras categorias"
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Categoria vazia')
    expect(screen.getByText('Explore outras categorias')).toBeInTheDocument()
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('renders product variant with SVG icon', () => {
    render(
      <EmptyState
        icon="product"
        title="Produto indisponível"
        description="Este produto não está mais disponível"
      />
    )

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Produto indisponível')
    expect(screen.getByText('Este produto não está mais disponível')).toBeInTheDocument()
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('renders optional CTA button when action is provided', () => {
    render(
      <EmptyState
        icon="cart"
        title="Carrinho vazio"
        description="Seu carrinho está vazio"
        action={{ label: 'Ver Catálogo', href: '/marketplace' }}
      />
    )

    const link = screen.getByRole('link', { name: 'Ver Catálogo' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/marketplace')
    expect(link).toHaveClass('mp-btn-primary')
  })

  it('does not render CTA button when action is not provided', () => {
    render(
      <EmptyState
        icon="cart"
        title="Carrinho vazio"
        description="Seu carrinho está vazio"
      />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('applies mp-heading-3 class to the title', () => {
    render(
      <EmptyState
        icon="search"
        title="Sem resultados"
        description="Nenhum produto encontrado"
      />
    )

    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveClass('mp-heading-3')
  })

  it('applies muted color to description text', () => {
    render(
      <EmptyState
        icon="cart"
        title="Vazio"
        description="Descrição muted"
      />
    )

    const description = screen.getByText('Descrição muted')
    expect(description).toHaveStyle({ color: 'var(--mp-text-muted)' })
  })

  it('centers content with py-16 padding', () => {
    const { container } = render(
      <EmptyState
        icon="cart"
        title="Vazio"
        description="Teste"
      />
    )

    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('py-16')
    expect(wrapper).toHaveClass('items-center')
    expect(wrapper).toHaveClass('justify-center')
    expect(wrapper).toHaveClass('text-center')
  })
})
