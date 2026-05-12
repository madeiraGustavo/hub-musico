'use client'

import { useState, useEffect } from 'react'
import { apiGet } from '@/lib/api/client'
import { AppointmentCard } from './AppointmentCard'

interface Appointment {
  id:             string
  requesterName:  string
  requesterEmail: string
  requesterPhone: string | null
  serviceId:      string | null
  startAt:        string
  endAt:          string
  status:         'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED'
  notes:          string | null
  requestCode:    string
}

type ViewMode = 'month' | 'week' | 'day'

/**
 * Calendário do dashboard com navegação por mês, semana e dia.
 * Busca appointments via GET /appointments?from=&to= ao navegar.
 * Exibe horários no timezone do artista autenticado.
 *
 * Requirements: 11.1, 11.5
 */
export function CalendarView() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [viewMode, setViewMode]         = useState<ViewMode>('month')
  const [currentDate, setCurrentDate]   = useState(new Date())

  useEffect(() => {
    fetchAppointments()
  }, [currentDate, viewMode])

  async function fetchAppointments() {
    setLoading(true)
    try {
      const { from, to } = getDateRange(currentDate, viewMode)
      const data = await apiGet<{ data: Appointment[] }>(`/appointments?from=${from}&to=${to}`)
      setAppointments(data.data)
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  function getDateRange(date: Date, mode: ViewMode): { from: string; to: string } {
    const year  = date.getFullYear()
    const month = date.getMonth()

    if (mode === 'month') {
      const from = new Date(year, month, 1).toISOString().slice(0, 10)
      const to   = new Date(year, month + 1, 0).toISOString().slice(0, 10)
      return { from, to }
    }

    if (mode === 'week') {
      const dayOfWeek = date.getDay()
      const start     = new Date(date)
      start.setDate(date.getDate() - dayOfWeek)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return {
        from: start.toISOString().slice(0, 10),
        to:   end.toISOString().slice(0, 10),
      }
    }

    // day
    const dayStr = date.toISOString().slice(0, 10)
    return { from: dayStr, to: dayStr }
  }

  function navigate(direction: -1 | 1) {
    const next = new Date(currentDate)
    if (viewMode === 'month') next.setMonth(next.getMonth() + direction)
    else if (viewMode === 'week') next.setDate(next.getDate() + 7 * direction)
    else next.setDate(next.getDate() + direction)
    setCurrentDate(next)
  }

  function handleStatusChange(id: string, newStatus: Appointment['status']) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    )
  }

  const title = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year:  'numeric',
    ...(viewMode === 'day' && { day: '2-digit' }),
  })

  return (
    <div className="w-full">
      {/* Header com navegação */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary transition-colors"
            aria-label="Anterior"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-text-primary capitalize">{title}</h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary transition-colors"
            aria-label="Próximo"
          >
            →
          </button>
        </div>

        {/* Seletor de visualização */}
        <div className="flex gap-1 bg-bg-surface rounded-md p-1">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${viewMode === mode
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de appointments */}
      {loading ? (
        <div className="text-text-muted text-sm py-8 text-center">Carregando...</div>
      ) : appointments.length === 0 ? (
        <div className="text-text-muted text-sm py-8 text-center">
          Nenhum agendamento neste período.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
