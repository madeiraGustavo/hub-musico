/**
 * availability.service.ts
 *
 * Lógica pura de cálculo de slots livres.
 * Sem I/O, sem efeitos colaterais — apenas transformações de dados.
 *
 * Funções exportadas:
 *   - generateSlots(rules, from, to, timezone): Slot[]
 *   - filterConflicts(slots, occupied): Slot[]
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 8.2, 8.3
 */

import { fromZonedTime } from 'date-fns-tz'

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Slot {
  startAt: Date  // UTC
  endAt:   Date  // UTC
}

export interface TimeInterval {
  startAt: Date
  endAt:   Date
}

/**
 * Subconjunto de AvailabilityRule necessário para o cálculo de slots.
 * Mantido como interface local para que a função seja pura (sem dependência do Prisma).
 */
export interface AvailabilityRuleInput {
  weekday:     number   // 0 = domingo, 6 = sábado (JS Date.getDay())
  startTime:   string   // "HH:MM" em horário local do artista
  endTime:     string   // "HH:MM" em horário local do artista
  slotMinutes: number   // duração de cada slot em minutos
  active:      boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converte uma string "HH:MM" para { hours, minutes }.
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number)
  return { hours: h, minutes: m }
}

/**
 * Dado um Date representando um dia qualquer e um horário "HH:MM",
 * retorna um Date em UTC que representa esse horário naquele dia
 * no timezone especificado.
 *
 * Usa `fromZonedTime` do date-fns-tz: interpreta a data/hora como
 * sendo no timezone fornecido e converte para UTC.
 */
function toUtcFromLocal(day: Date, time: string, timezone: string): Date {
  const { hours, minutes } = parseTime(time)

  // Construir uma data "local" com o ano/mês/dia do `day` e o horário da regra.
  // Usamos os componentes UTC do `day` porque iteramos sobre dias em UTC midnight.
  const year  = day.getUTCFullYear()
  const month = day.getUTCMonth()
  const date  = day.getUTCDate()

  // fromZonedTime interpreta este Date como se fosse no timezone do artista
  // e retorna o equivalente UTC.
  const localDate = new Date(year, month, date, hours, minutes, 0, 0)
  return fromZonedTime(localDate, timezone)
}

// ── generateSlots ─────────────────────────────────────────────────────────────

/**
 * Gera todos os slots possíveis a partir das regras ativas,
 * para o período [from, to] (inclusive), respeitando o timezone do artista.
 *
 * Algoritmo:
 * 1. Iterar sobre cada dia no período [from, to]
 * 2. Para cada dia, verificar se o weekday corresponde a alguma regra ativa
 * 3. Para cada regra correspondente, converter startTime/endTime para UTC
 * 4. Gerar slots de slotMinutes minutos dentro da janela [windowStart, windowEnd)
 *
 * @param rules    - Regras de disponibilidade do artista
 * @param from     - Início do período (Date, interpretado como dia em UTC)
 * @param to       - Fim do período (Date, interpretado como dia em UTC, inclusive)
 * @param timezone - Timezone IANA do artista (ex: "America/Sao_Paulo")
 * @returns        - Array de slots em UTC
 */
export function generateSlots(
  rules:    AvailabilityRuleInput[],
  from:     Date,
  to:       Date,
  timezone: string,
): Slot[] {
  const activeRules = rules.filter((r) => r.active)

  if (activeRules.length === 0) {
    return []
  }

  const slots: Slot[] = []
  const slotDurationMs = (minutes: number) => minutes * 60 * 1000

  // Normalizar from/to para UTC midnight do dia
  const startDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const endDay   = new Date(Date.UTC(to.getUTCFullYear(),   to.getUTCMonth(),   to.getUTCDate()))

  // Iterar dia a dia
  const current = new Date(startDay)
  while (current <= endDay) {
    const weekday = current.getUTCDay() // 0 = domingo, 6 = sábado

    // Encontrar todas as regras ativas para este weekday
    const matchingRules = activeRules.filter((r) => r.weekday === weekday)

    for (const rule of matchingRules) {
      const windowStart = toUtcFromLocal(current, rule.startTime, timezone)
      const windowEnd   = toUtcFromLocal(current, rule.endTime,   timezone)

      // Gerar slots dentro da janela [windowStart, windowEnd)
      const durationMs = slotDurationMs(rule.slotMinutes)
      let slotStart = windowStart.getTime()

      while (slotStart + durationMs <= windowEnd.getTime()) {
        slots.push({
          startAt: new Date(slotStart),
          endAt:   new Date(slotStart + durationMs),
        })
        slotStart += durationMs
      }
    }

    // Avançar para o próximo dia
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return slots
}

// ── filterConflicts ───────────────────────────────────────────────────────────

/**
 * Remove slots que conflitam com qualquer intervalo em `occupied`.
 *
 * Definição de conflito (sobreposição temporal):
 *   slot.startAt < occupied.endAt AND slot.endAt > occupied.startAt
 *
 * Todos os intervalos são comparados em UTC.
 *
 * @param slots    - Slots candidatos (gerados por generateSlots)
 * @param occupied - Intervalos ocupados (Appointments PENDING/CONFIRMED + AvailabilityBlocks)
 * @returns        - Slots sem conflito
 */
export function filterConflicts(
  slots:    Slot[],
  occupied: TimeInterval[],
): Slot[] {
  if (occupied.length === 0) {
    return slots
  }

  return slots.filter((slot) => {
    const slotStart = slot.startAt.getTime()
    const slotEnd   = slot.endAt.getTime()

    return !occupied.some((interval) => {
      const occStart = interval.startAt.getTime()
      const occEnd   = interval.endAt.getTime()

      // Conflito: slot.startAt < occupied.endAt AND slot.endAt > occupied.startAt
      return slotStart < occEnd && slotEnd > occStart
    })
  })
}
