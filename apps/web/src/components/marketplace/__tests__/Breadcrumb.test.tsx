/**
 * Breadcrumb.test.tsx
 *
 * Unit tests for the Breadcrumb component.
 * Requirements: 2.4, 15.4
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb'

describe('Breadcrumb', () => {
  it('renders nothing when items array is empty', () => {
    const { container } = render(<Breadcrumb items={[]} />)
    expect(container.querySelector('nav')).toBeNull()
  })

  it('renders a nav element with aria-label="Breadcrumb"', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Produto' },
    ]
    render(<Breadcrumb items={items} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
  })

  it('renders an ordered list (ol) inside the nav', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Categoria' },
    ]
    render(<Breadcrumb items={items} />)
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const list = nav.querySelector('ol')
    expect(list).toBeInTheDocument()
  })

  it('renders links for items with href', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Categoria', href: '/marketplace/category/toldos' },
      { label: 'Produto Atual' },
    ]
    render(<Breadcrumb items={items} />)

    const marketplaceLink = screen.getByRole('link', { name: 'Marketplace' })
    expect(marketplaceLink).toHaveAttribute('href', '/marketplace')

    const categoryLink = screen.getByRole('link', { name: 'Categoria' })
    expect(categoryLink).toHaveAttribute('href', '/marketplace/category/toldos')
  })

  it('renders last item as non-clickable span with aria-current="page"', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Produto Atual' },
    ]
    render(<Breadcrumb items={items} />)

    // Last item should not be a link
    expect(screen.queryByRole('link', { name: 'Produto Atual' })).toBeNull()

    // Should have aria-current="page"
    const currentItem = screen.getByText('Produto Atual')
    expect(currentItem).toHaveAttribute('aria-current', 'page')
    expect(currentItem.tagName).toBe('SPAN')
  })

  it('renders separator between items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Categoria', href: '/marketplace/category/toldos' },
      { label: 'Produto' },
    ]
    const { container } = render(<Breadcrumb items={items} />)

    // Separators should be hidden from screen readers
    const separators = container.querySelectorAll('[aria-hidden="true"]')
    expect(separators).toHaveLength(2)
    expect(separators[0]!.textContent).toBe('/')
    expect(separators[1]!.textContent).toBe('/')
  })

  it('renders single item as current page without separator', () => {
    const items: BreadcrumbItem[] = [{ label: 'Marketplace' }]
    const { container } = render(<Breadcrumb items={items} />)

    const separators = container.querySelectorAll('[aria-hidden="true"]')
    expect(separators).toHaveLength(0)

    const currentItem = screen.getByText('Marketplace')
    expect(currentItem).toHaveAttribute('aria-current', 'page')
  })
})
