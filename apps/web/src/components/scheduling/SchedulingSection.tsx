'use client'

import { useState, useEffect } from 'react'
import { AvailabilityCalendar, type Slot } from './AvailabilityCalendar'
import { SlotPicker } from './SlotPicker'
import { AppointmentForm } from './AppointmentForm'
import { StatusChecker } from './StatusChecker'

interface SchedulingSectionProps {
  artistId: string
}

/**
 * Seção completa de agendamento público.
 * Busca disponibilidade ao carregar (próximos 30 dias).
 * Integra AvailabilityCalendar, SlotPicker, AppointmentForm e StatusChecker.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export function SchedulingSection({ artistId }: SchedulingSectionProps) {
  const [slots, setSlots]             = useState<Slot[]>([])
  const [timezone, setTimezone]       = useState<string>('America/Sao_Paulo')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true)
      setError(null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const today  = new Date()
      const from   = today.toISOString().split('T')[0]
      const to     = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      try {
        const res = await fetch(`${apiUrl}/public/artists/${artistId}/availability?from=${from}&to=${to}`)

        if (!res.ok) {
          setSlots([])
          return
        }

        const data = await res.json() as { slots: Slot[]; timezone: string }
        setSlots(data.slots)
        setTimezone(data.timezone)
      } catch {
        setError('Não foi possível carregar os horários disponíveis.')
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [artistId])

  function handleDaySelect(date: Date) {
    setSelectedDay(date)
    setSelectedSlot(null)
  }

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot)
  }

  if (loading) {
    return (
      <section id="agendamento" className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-head font-bold text-text-primary mb-6">Agendamento</h2>
          <div className="text-text-muted text-sm">Carregando horários disponíveis...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="agendamento" className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-head font-bold text-text-primary mb-6">Agendamento</h2>
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </section>
    )
  }

  return (
    <section id="agendamento" className="py-16">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-head font-bold text-text-primary mb-8">Agendamento</h2>

        <div className="space-y-8">
          {/* Calendário */}
          <AvailabilityCalendar
            slots={slots}
            timezone={timezone}
            onDaySelect={handleDaySelect}
            selectedDay={selectedDay}
          />

          {/* Horários do dia selecionado */}
          {selectedDay && (
            <SlotPicker
              slots={slots}
              timezone={timezone}
              selectedDay={selectedDay}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          )}

          {/* Formulário de solicitação */}
          {selectedSlot && (
            <AppointmentForm
              artistId={artistId}
              slot={selectedSlot}
              timezone={timezone}
            />
          )}

          {/* Separador */}
          <div className="border-t border-[rgba(255,255,255,0.07)] pt-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Consultar status da solicitação
            </h3>
            <StatusChecker timezone={timezone} />
          </div>
        </div>
      </div>
    </section>
  )
}
