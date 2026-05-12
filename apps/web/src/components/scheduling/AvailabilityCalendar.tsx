'use client'

import { useMemo } from 'react'

export interface Slot {
  startAt: string // ISO 8601 UTC
  endAt:   string // ISO 8601 UTC
}

interface AvailabilityCalendarProps {
  slots:       Slot[]
  timezone:    string
  onDaySelect: (date: Date) => void
  selectedDay?: Date | null
}

/**
 * Calendário mensal que destaca apenas dias com slots disponíveis.
 * Ao clicar em um dia disponível, emite o dia selecionado via callback.
 *
 * Requirements: 10.1
 */
export function AvailabilityCalendar({
  slots,
  timezone,
  onDaySelect,
  selectedDay,
}: AvailabilityCalendarProps) {
  // Calcular quais dias têm slots disponíveis
  const availableDays = useMemo(() => {
    const days = new Set<string>()
    for (const slot of slots) {
      // Converter UTC para o timezone do artista para determinar o dia local
      const localDate = new Date(slot.startAt).toLocaleDateString('en-CA', { timeZone: timezone })
      days.add(localDate)
    }
    return days
  }, [slots, timezone])

  // Gerar dias do mês atual
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth  = new Date(year, month + 1, 0)
  const startWeekday    = firstDayOfMonth.getDay() // 0=dom

  const daysInMonth = lastDayOfMonth.getDate()

  const monthName = firstDayOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Gerar grid de dias
  const cells: Array<{ day: number | null; dateStr: string; isAvailable: boolean; isSelected: boolean; isToday: boolean }> = []

  // Células vazias antes do primeiro dia
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: null, dateStr: '', isAvailable: false, isSelected: false, isToday: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr    = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isAvailable = availableDays.has(dateStr)
    const isToday     = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    const isSelected  = selectedDay
      ? selectedDay.getFullYear() === year && selectedDay.getMonth() === month && selectedDay.getDate() === d
      : false

    cells.push({ day: d, dateStr, isAvailable, isSelected, isToday })
  }

  function handleDayClick(dateStr: string, isAvailable: boolean) {
    if (!isAvailable) return
    const parts = dateStr.split('-').map(Number)
    const y = parts[0]!
    const m = parts[1]!
    const d = parts[2]!
    onDaySelect(new Date(y, m - 1, d))
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-text-primary mb-4 capitalize">{monthName}</h3>

      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((wd) => (
          <div key={wd} className="text-center text-xs text-text-muted font-medium py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.day === null) {
            return <div key={`empty-${idx}`} className="h-10" />
          }

          const baseClasses = 'h-10 flex items-center justify-center rounded-md text-sm transition-all'

          let stateClasses: string
          if (cell.isSelected) {
            stateClasses = 'bg-accent text-white font-bold'
          } else if (cell.isAvailable) {
            stateClasses = 'bg-accent-dim text-accent border border-[rgba(108,99,255,0.35)] cursor-pointer hover:bg-accent hover:text-white'
          } else {
            stateClasses = 'text-text-muted cursor-default'
          }

          const todayRing = cell.isToday ? 'ring-1 ring-accent' : ''

          return (
            <button
              key={cell.dateStr}
              type="button"
              disabled={!cell.isAvailable}
              onClick={() => handleDayClick(cell.dateStr, cell.isAvailable)}
              className={`${baseClasses} ${stateClasses} ${todayRing}`}
              aria-label={`${cell.day} ${cell.isAvailable ? '- disponível' : '- indisponível'}`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
