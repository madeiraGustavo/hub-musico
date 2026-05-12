'use client'

import { StatusActions } from './StatusActions'

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

interface AppointmentCardProps {
  appointment:    Appointment
  onStatusChange: (id: string, newStatus: Appointment['status']) => void
}

const STATUS_BADGE: Record<Appointment['status'], { label: string; classes: string }> = {
  PENDING:   { label: 'Pendente',   classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' },
  CONFIRMED: { label: 'Confirmado', classes: 'bg-green-400/10 text-green-400 border-green-400/30' },
  CANCELLED: { label: 'Cancelado',  classes: 'bg-red-400/10 text-red-400 border-red-400/30' },
  REJECTED:  { label: 'Rejeitado',  classes: 'bg-red-400/10 text-red-400 border-red-400/30' },
}

/**
 * Card de appointment no dashboard.
 * Exibe nome do solicitante, serviço (se houver) e status com badge colorido.
 * Ao clicar, mostra detalhes com ações disponíveis.
 *
 * Requirements: 11.2
 */
export function AppointmentCard({ appointment, onStatusChange }: AppointmentCardProps) {
  const badge = STATUS_BADGE[appointment.status]

  const startTime = new Date(appointment.startAt).toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
  })
  const endTime = new Date(appointment.endAt).toLocaleTimeString('pt-BR', {
    hour:   '2-digit',
    minute: '2-digit',
  })
  const dateStr = new Date(appointment.startAt).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'short',
  })

  return (
    <div className="bg-bg-elevated border border-[rgba(255,255,255,0.07)] rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary truncate">
              {appointment.requesterName}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.classes}`}>
              {badge.label}
            </span>
          </div>

          <div className="text-xs text-text-muted space-y-0.5">
            <div>{dateStr} • {startTime} — {endTime}</div>
            {appointment.notes && (
              <div className="text-text-secondary mt-1 line-clamp-1">{appointment.notes}</div>
            )}
          </div>
        </div>

        {/* Ações de status */}
        <StatusActions
          appointmentId={appointment.id}
          currentStatus={appointment.status}
          onStatusChange={(newStatus) => onStatusChange(appointment.id, newStatus)}
        />
      </div>
    </div>
  )
}
