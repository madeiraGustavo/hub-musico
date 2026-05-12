/**
 * scheduling.test.tsx
 *
 * Testes de componente para a UI pública de agendamento.
 * Requirements: 10.1, 10.3, 10.4, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AvailabilityCalendar, type Slot } from './AvailabilityCalendar'
import { AppointmentForm } from './AppointmentForm'
import { StatusChecker } from './StatusChecker'

// ── Mock fetch ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
})

// ── AvailabilityCalendar ──────────────────────────────────────────────────────

describe('AvailabilityCalendar', () => {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()

  // Create a slot for today (if today has availability)
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const slots: Slot[] = [
    { startAt: `${todayStr}T14:00:00.000Z`, endAt: `${todayStr}T15:00:00.000Z` },
    { startAt: `${todayStr}T15:00:00.000Z`, endAt: `${todayStr}T16:00:00.000Z` },
  ]

  it('renderiza dias disponíveis com estilo diferenciado', () => {
    const onDaySelect = vi.fn()

    render(
      <AvailabilityCalendar
        slots={slots}
        timezone="UTC"
        onDaySelect={onDaySelect}
      />,
    )

    // O dia de hoje deve estar renderizado
    const dayButton = screen.getByRole('button', { name: new RegExp(`${today.getDate()}`) })
    expect(dayButton).toBeInTheDocument()
  })

  it('chama onDaySelect ao clicar em um dia disponível', () => {
    const onDaySelect = vi.fn()

    render(
      <AvailabilityCalendar
        slots={slots}
        timezone="UTC"
        onDaySelect={onDaySelect}
      />,
    )

    const dayButton = screen.getByRole('button', { name: new RegExp(`${today.getDate()}.*disponível`) })
    fireEvent.click(dayButton)

    expect(onDaySelect).toHaveBeenCalledTimes(1)
    expect(onDaySelect).toHaveBeenCalledWith(expect.any(Date))
  })

  it('não chama onDaySelect ao clicar em um dia indisponível', () => {
    const onDaySelect = vi.fn()

    // Slots only for today — other days are unavailable
    render(
      <AvailabilityCalendar
        slots={slots}
        timezone="UTC"
        onDaySelect={onDaySelect}
      />,
    )

    // Find any disabled button (unavailable day)
    const unavailableButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('disabled') !== null,
    )
    expect(unavailableButtons.length).toBeGreaterThan(0)
    fireEvent.click(unavailableButtons[0]!)

    expect(onDaySelect).not.toHaveBeenCalled()
  })
})

// ── AppointmentForm ───────────────────────────────────────────────────────────

describe('AppointmentForm', () => {
  const slot: Slot = {
    startAt: '2025-06-15T14:00:00.000Z',
    endAt:   '2025-06-15T15:00:00.000Z',
  }

  it('submete dados e exibe requestCode após sucesso', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:     true,
      status: 201,
      json:   () => Promise.resolve({ requestCode: 'abc-123-def', status: 'PENDING' }),
    })

    render(<AppointmentForm artistId="artist-001" slot={slot} timezone="America/Sao_Paulo" />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João Silva' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'joao@test.com' } })
    fireEvent.click(screen.getByRole('button', { name: /solicitar/i }))

    await waitFor(() => {
      expect(screen.getByText('abc-123-def')).toBeInTheDocument()
    })

    expect(screen.getByText(/PENDING/)).toBeInTheDocument()
  })

  it('exibe mensagem de erro quando horário está indisponível (409)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:     false,
      status: 409,
      json:   () => Promise.resolve({ error: 'Conflito' }),
    })

    render(<AppointmentForm artistId="artist-001" slot={slot} timezone="America/Sao_Paulo" />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'j@t.com' } })
    fireEvent.click(screen.getByRole('button', { name: /solicitar/i }))

    await waitFor(() => {
      expect(screen.getByText(/não está mais disponível/i)).toBeInTheDocument()
    })
  })
})

// ── StatusChecker ─────────────────────────────────────────────────────────────

describe('StatusChecker', () => {
  it('exibe status ao consultar requestCode válido', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:     true,
      status: 200,
      json:   () => Promise.resolve({
        requestCode: 'abc-123',
        status:      'CONFIRMED',
        startAt:     '2025-06-15T14:00:00.000Z',
        endAt:       '2025-06-15T15:00:00.000Z',
      }),
    })

    render(<StatusChecker timezone="America/Sao_Paulo" />)

    fireEvent.change(screen.getByLabelText(/código/i), { target: { value: 'abc-123' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText('Confirmado')).toBeInTheDocument()
    })
  })

  it('exibe erro quando requestCode não é encontrado (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:     false,
      status: 404,
      json:   () => Promise.resolve({ error: 'Not found' }),
    })

    render(<StatusChecker timezone="America/Sao_Paulo" />)

    fireEvent.change(screen.getByLabelText(/código/i), { target: { value: 'invalid-code' } })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText(/não encontrado/i)).toBeInTheDocument()
    })
  })
})
