'use client'

import type { Slot } from './AvailabilityCalendar'

interface SlotPickerProps {
  slots:        Slot[]
  timezone:     string
  selectedDay:  Date
  onSlotSelect: (slot: Slot) => void
  selectedSlot?: Slot | null
}

/**
 * Lista os horários livres do dia selecionado.
 * Exibe horários no timezone do artista.
 * Ao selecionar um horário, emite o slot via callback.
 *
 * Requirements: 10.2
 */
export function SlotPicker({
  slots,
  timezone,
  selectedDay,
  onSlotSelect,
  selectedSlot,
}: SlotPickerProps) {
  // Filtrar slots do dia selecionado (comparando no timezone do artista)
  const selectedDateStr = selectedDay.toLocaleDateString('en-CA', { timeZone: timezone })

  const daySlots = slots.filter((slot) => {
    const slotDateStr = new Date(slot.startAt).toLocaleDateString('en-CA', { timeZone: timezone })
    return slotDateStr === selectedDateStr
  })

  if (daySlots.length === 0) {
    return (
      <div className="text-text-muted text-sm py-4">
        Nenhum horário disponível neste dia.
      </div>
    )
  }

  function formatTime(isoStr: string): string {
    return new Date(isoStr).toLocaleTimeString('pt-BR', {
      timeZone: timezone,
      hour:     '2-digit',
      minute:   '2-digit',
    })
  }

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-text-secondary mb-3">
        Horários disponíveis — {selectedDay.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
      </h4>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {daySlots.map((slot) => {
          const isSelected = selectedSlot?.startAt === slot.startAt && selectedSlot?.endAt === slot.endAt

          return (
            <button
              key={slot.startAt}
              type="button"
              onClick={() => onSlotSelect(slot)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all border
                ${isSelected
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-elevated text-text-primary border-[rgba(255,255,255,0.07)] hover:border-accent hover:text-accent'
                }`}
              aria-label={`Horário ${formatTime(slot.startAt)} até ${formatTime(slot.endAt)}`}
            >
              {formatTime(slot.startAt)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
