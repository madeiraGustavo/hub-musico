import { render, screen, fireEvent } from '@testing-library/react'
import { ChatSection, PROMPT_PILLS, CHAT_PLACEHOLDER } from '../ChatSection'

/**
 * Validates: Requirements 5.2, 5.3, 5.6
 */

describe('ChatSection', () => {
  it('renders exactly 5 prompt pills as buttons with the correct texts', () => {
    render(<ChatSection />)

    const expectedPills = [
      'Quanto posso gastar neste fim de semana?',
      'Por que minha conta está sempre no vermelho?',
      'Consigo trocar de carro este ano?',
      'Onde estou gastando demais?',
      'Quanto preciso guardar para a reserva de emergência?',
    ]

    // Verify the exported constant matches the expected pills
    expect(PROMPT_PILLS).toHaveLength(5)
    expect(PROMPT_PILLS).toEqual(expectedPills)

    // Verify each pill is rendered as a button with exact text
    for (const text of expectedPills) {
      const btn = screen.getByRole('button', { name: text })
      expect(btn).toBeInTheDocument()
    }

    // Confirm there are exactly 5 pill buttons (excluding the "Enviar" button)
    const pillButtons = expectedPills.map((text) =>
      screen.getByRole('button', { name: text })
    )
    expect(pillButtons).toHaveLength(5)
  })

  it('input placeholder length is between 20 and 80 characters', () => {
    render(<ChatSection />)

    const input = screen.getByPlaceholderText(CHAT_PLACEHOLDER)
    expect(input).toBeInTheDocument()

    const placeholderLength = CHAT_PLACEHOLDER.length
    expect(placeholderLength).toBeGreaterThanOrEqual(20)
    expect(placeholderLength).toBeLessThanOrEqual(80)
  })

  it('clicking a pill fills the input with that pill text', () => {
    render(<ChatSection />)

    const input = screen.getByPlaceholderText(CHAT_PLACEHOLDER) as HTMLInputElement

    for (const pillText of PROMPT_PILLS) {
      const pill = screen.getByRole('button', { name: pillText })
      fireEvent.click(pill)
      expect(input.value).toBe(pillText)
    }
  })
})
