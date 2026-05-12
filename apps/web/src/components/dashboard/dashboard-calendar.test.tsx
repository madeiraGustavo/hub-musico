/**
 * dashboard-calendar.test.tsx
 *
 * Testes de componente para o dashboard de calendário.
 * Requirements: 11.2, 11.3, 11.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AppointmentCard } from './AppointmentCard'
import { StatusActions } from './StatusActions'

// ── Mock API client ───────────────────────────────────────────────────────────

vi.mock('@/lib/api/client', () => ({
  apiGet:    vi.fn(),
  apiPost:   vi.fn(),
  apiPatch:  vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiPatch } from '@/lib/api/client'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── AppointmentCard ───────────────────────────────────────────────────────────

describe('AppointmentCard', () => {
  const baseAppointment = {
    id:             'appt-001',
    requesterName:  'João Silva',
    requesterEmail: 'joao@test.com',
    requesterPhone: null,
    serviceId:      null,
    startAt:        '2025-06-15T14:00:00.000Z',
    endAt:          '2025-06-15T15:00:00.000Z',
    status:         'PENDING' as const,
    notes:          null,
    requestCode:    'req-001',
  }

  it('renderiza nome do solicitante e status', () => {
    render(<AppointmentCard appointment={baseAppointment} onStatusChange={vi.fn()} />)

    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('exibe botões Confirmar, Rejeitar e Cancelar para status PENDING', () => {
    render(<AppointmentCard appointment={baseAppointment} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('exibe apenas botão Cancelar para status CONFIRMED', () => {
    const confirmed = { ...baseAppointment, status: 'CONFIRMED' as const }
    render(<AppointmentCard appointment={confirmed} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument()
  })

  it('não exibe botões para status CANCELLED', () => {
    const cancelled = { ...baseAppointment, status: 'CANCELLED' as const }
    render(<AppointmentCard appointment={cancelled} onStatusChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
  })
})

// ── StatusActions ─────────────────────────────────────────────────────────────

describe('StatusActions', () => {
  it('chama PATCH /appointments/:id/status ao confirmar', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ data: { id: 'appt-001', status: 'CONFIRMED' } })
    const onStatusChange = vi.fn()

    render(
      <StatusActions
        appointmentId="appt-001"
        currentStatus="PENDING"
        onStatusChange={onStatusChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith('/appointments/appt-001/status', { status: 'CONFIRMED' })
      expect(onStatusChange).toHaveBeenCalledWith('CONFIRMED')
    })
  })

  it('chama PATCH /appointments/:id/status ao rejeitar', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ data: { id: 'appt-001', status: 'REJECTED' } })
    const onStatusChange = vi.fn()

    render(
      <StatusActions
        appointmentId="appt-001"
        currentStatus="PENDING"
        onStatusChange={onStatusChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith('/appointments/appt-001/status', { status: 'REJECTED' })
      expect(onStatusChange).toHaveBeenCalledWith('REJECTED')
    })
  })

  it('chama PATCH /appointments/:id/status ao cancelar (CONFIRMED → CANCELLED)', async () => {
    vi.mocked(apiPatch).mockResolvedValueOnce({ data: { id: 'appt-002', status: 'CANCELLED' } })
    const onStatusChange = vi.fn()

    render(
      <StatusActions
        appointmentId="appt-002"
        currentStatus="CONFIRMED"
        onStatusChange={onStatusChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith('/appointments/appt-002/status', { status: 'CANCELLED' })
      expect(onStatusChange).toHaveBeenCalledWith('CANCELLED')
    })
  })
})
