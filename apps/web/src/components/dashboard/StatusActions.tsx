'use client'

import { useState } from 'react'
import { apiPatch } from '@/lib/api/client'

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED'

interface StatusActionsProps {
  appointmentId:  string
  currentStatus:  AppointmentStatus
  onStatusChange: (newStatus: AppointmentStatus) => void
}

/**
 * Botões contextuais baseados no status atual do Appointment.
 * PENDING: botões Confirmar, Rejeitar, Cancelar
 * CONFIRMED: botão Cancelar
 * Ao clicar, chama PATCH /appointments/:id/status.
 * Atualiza estado local imediatamente após resposta 200 (sem reload).
 *
 * Requirements: 11.3, 11.4
 */
export function StatusActions({ appointmentId, currentStatus, onStatusChange }: StatusActionsProps) {
  const [loading, setLoading] = useState(false)

  async function handleAction(newStatus: AppointmentStatus) {
    setLoading(true)
    try {
      await apiPatch(`/appointments/${appointmentId}/status`, { status: newStatus })
      onStatusChange(newStatus)
    } catch {
      // Silently fail — could add toast notification
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {currentStatus === 'PENDING' && (
        <>
          <button
            onClick={() => handleAction('CONFIRMED')}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-green-400/10 text-green-400
              border border-green-400/30 hover:bg-green-400/20 transition-colors disabled:opacity-50"
            aria-label="Confirmar agendamento"
          >
            Confirmar
          </button>
          <button
            onClick={() => handleAction('REJECTED')}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400
              border border-red-400/30 hover:bg-red-400/20 transition-colors disabled:opacity-50"
            aria-label="Rejeitar agendamento"
          >
            Rejeitar
          </button>
          <button
            onClick={() => handleAction('CANCELLED')}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-bg-surface text-text-muted
              border border-[rgba(255,255,255,0.07)] hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
            aria-label="Cancelar agendamento"
          >
            Cancelar
          </button>
        </>
      )}

      {currentStatus === 'CONFIRMED' && (
        <button
          onClick={() => handleAction('CANCELLED')}
          disabled={loading}
          className="px-2.5 py-1 rounded text-xs font-medium bg-red-400/10 text-red-400
            border border-red-400/30 hover:bg-red-400/20 transition-colors disabled:opacity-50"
          aria-label="Cancelar agendamento"
        >
          Cancelar
        </button>
      )}
    </div>
  )
}
