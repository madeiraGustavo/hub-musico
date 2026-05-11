import { render } from '@testing-library/react'
import { readFileSync } from 'fs'
import { join } from 'path'

vi.mock('next/font/google', () => ({
  Anton: () => ({ variable: '--font-anton', className: 'mock-anton' }),
}))

// Dynamic imports after mock setup
const { metadata, default: PlumaPage } = await import('../../../app/pluma/page')

describe('PlumaPage metadata', () => {
  it('metadata.title equals "Pluma — Assistente Financeiro com IA"', () => {
    // Requirement 1.3
    expect(metadata.title).toBe('Pluma — Assistente Financeiro com IA')
  })

  it('metadata.description length is between 50 and 160 characters', () => {
    // Requirement 1.3
    const description = metadata.description as string
    expect(description.length).toBeGreaterThanOrEqual(50)
    expect(description.length).toBeLessThanOrEqual(160)
  })
})

describe('PlumaPage render', () => {
  it('renders a <main> element', () => {
    // Requirement 1.4
    render(<PlumaPage />)
    const main = document.querySelector('main')
    expect(main).toBeInTheDocument()
  })
})

describe('PlumaPage isolation (static check)', () => {
  it('does not import from forbidden paths (musician/, tattoo/, shared/)', () => {
    // Requirement 1.5
    const pagePath = join(
      __dirname,
      '../../../app/pluma/page.tsx'
    )
    const source = readFileSync(pagePath, 'utf-8')

    expect(source).not.toMatch(/from\s+['"][^'"]*musician\//)
    expect(source).not.toMatch(/from\s+['"][^'"]*tattoo\//)
    expect(source).not.toMatch(/from\s+['"][^'"]*shared\//)
  })
})
