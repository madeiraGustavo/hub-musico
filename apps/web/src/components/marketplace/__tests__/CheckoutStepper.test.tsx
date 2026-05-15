import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CheckoutStepper, deriveStepStates } from '../CheckoutStepper'

describe('deriveStepStates', () => {
  it('marks completed steps, active step, and disabled steps correctly', () => {
    const result = deriveStepStates('data', ['cart'])
    expect(result).toEqual([
      { step: 'cart', label: 'Carrinho', state: 'completed' },
      { step: 'data', label: 'Dados', state: 'active' },
      { step: 'confirmation', label: 'Confirmação', state: 'disabled' },
    ])
  })

  it('marks first step as active when no steps are completed', () => {
    const result = deriveStepStates('cart', [])
    expect(result).toEqual([
      { step: 'cart', label: 'Carrinho', state: 'active' },
      { step: 'data', label: 'Dados', state: 'disabled' },
      { step: 'confirmation', label: 'Confirmação', state: 'disabled' },
    ])
  })

  it('marks all previous steps as completed when on confirmation', () => {
    const result = deriveStepStates('confirmation', ['cart', 'data'])
    expect(result).toEqual([
      { step: 'cart', label: 'Carrinho', state: 'completed' },
      { step: 'data', label: 'Dados', state: 'completed' },
      { step: 'confirmation', label: 'Confirmação', state: 'active' },
    ])
  })

  it('prioritizes completed over active if step is in completedSteps', () => {
    // Edge case: if the current step is also in completedSteps, completed wins
    const result = deriveStepStates('cart', ['cart'])
    expect(result[0]).toEqual({ step: 'cart', label: 'Carrinho', state: 'completed' })
  })
})

describe('CheckoutStepper component', () => {
  it('renders all three step labels', () => {
    render(<CheckoutStepper currentStep="cart" completedSteps={[]} />)
    expect(screen.getByText('Carrinho')).toBeInTheDocument()
    expect(screen.getByText('Dados')).toBeInTheDocument()
    expect(screen.getByText('Confirmação')).toBeInTheDocument()
  })

  it('renders a nav with aria-label for accessibility', () => {
    render(<CheckoutStepper currentStep="data" completedSteps={['cart']} />)
    const nav = screen.getByRole('navigation', { name: 'Progresso do checkout' })
    expect(nav).toBeInTheDocument()
  })

  it('marks the active step with aria-current="step"', () => {
    render(<CheckoutStepper currentStep="data" completedSteps={['cart']} />)
    const activeCircle = document.querySelector('[aria-current="step"]')
    expect(activeCircle).toBeInTheDocument()
    // The active step should show number "2"
    expect(activeCircle?.textContent).toBe('2')
  })

  it('renders a check icon SVG for completed steps', () => {
    render(<CheckoutStepper currentStep="confirmation" completedSteps={['cart', 'data']} />)
    // Completed steps render SVG check icons
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBe(2) // cart and data are completed
  })

  it('renders step numbers for non-completed steps', () => {
    render(<CheckoutStepper currentStep="cart" completedSteps={[]} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
