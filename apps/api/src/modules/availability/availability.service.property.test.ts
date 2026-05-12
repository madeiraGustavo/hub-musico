/**
 * availability.service.property.test.ts
 *
 * Property-based tests for availability.service.ts (pure functions).
 *
 * Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública
 *   Validates: Requirements 3.4, 3.5
 *
 * Property 5: Geração de slots respeita regras ativas
 *   Validates: Requirements 3.3
 *
 * Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local
 *   Validates: Requirements 8.2
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { toZonedTime } from 'date-fns-tz'
import {
  generateSlots,
  filterConflicts,
  type AvailabilityRuleInput,
  type Slot,
  type TimeInterval,
} from './availability.service.js'

fc.configureGlobal({ numRuns: 100 })

// ── Generators ────────────────────────────────────────────────────────────────

/** Generates a valid HH:MM time string */
const fcTime = fc
  .tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
  )
  .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)

/** Generates a pair of times where startTime < endTime */
const fcValidTimePair = fc
  .tuple(fcTime, fcTime)
  .filter(([s, e]) => s < e)

/** Generates a valid AvailabilityRuleInput with active = true */
const fcActiveRule = fcValidTimePair.chain(([startTime, endTime]) =>
  fc.record({
    weekday:     fc.integer({ min: 0, max: 6 }),
    startTime:   fc.constant(startTime),
    endTime:     fc.constant(endTime),
    slotMinutes: fc.integer({ min: 15, max: 120 }),
    active:      fc.constant(true as const),
  }),
)

/** Generates a valid AvailabilityRuleInput with active = false */
const fcInactiveRule = fcValidTimePair.chain(([startTime, endTime]) =>
  fc.record({
    weekday:     fc.integer({ min: 0, max: 6 }),
    startTime:   fc.constant(startTime),
    endTime:     fc.constant(endTime),
    slotMinutes: fc.integer({ min: 15, max: 120 }),
    active:      fc.constant(false as const),
  }),
)

/** Generates a UTC midnight Date for a day in a reasonable range */
const fcUtcDay = fc
  .integer({ min: 0, max: 364 })
  .map((offset) => {
    const base = new Date('2025-01-06T00:00:00Z') // Monday
    return new Date(Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth(),
      base.getUTCDate() + offset,
    ))
  })

/** Generates a [from, to] pair spanning 1–7 days */
const fcDateRange = fcUtcDay.chain((from) =>
  fc.integer({ min: 0, max: 6 }).map((span) => {
    const to = new Date(from)
    to.setUTCDate(to.getUTCDate() + span)
    return { from, to }
  }),
)

/** A small set of well-known IANA timezones to keep tests fast */
const fcTimezone = fc.constantFrom(
  'America/Sao_Paulo',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'UTC',
)

// ── Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública ──

// Feature: scheduling-system, Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública
describe('Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública', () => {
  it(
    'filterConflicts: nenhum slot retornado se sobrepõe a qualquer intervalo ocupado (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          // Generate a set of candidate slots
          fc.array(
            fc.record({
              startAt: fc.date({
                min: new Date('2025-01-01T00:00:00Z'),
                max: new Date('2025-12-31T22:00:00Z'),
              }),
              durationMinutes: fc.integer({ min: 15, max: 120 }),
            }),
            { minLength: 0, maxLength: 20 },
          ),
          // Generate a set of occupied intervals
          fc.array(
            fc.record({
              startAt: fc.date({
                min: new Date('2025-01-01T00:00:00Z'),
                max: new Date('2025-12-31T22:00:00Z'),
              }),
              durationMinutes: fc.integer({ min: 15, max: 120 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (rawSlots, rawOccupied) => {
            const slots: Slot[] = rawSlots.map(({ startAt, durationMinutes }) => ({
              startAt,
              endAt: new Date(startAt.getTime() + durationMinutes * 60_000),
            }))

            const occupied: TimeInterval[] = rawOccupied.map(({ startAt, durationMinutes }) => ({
              startAt,
              endAt: new Date(startAt.getTime() + durationMinutes * 60_000),
            }))

            const free = filterConflicts(slots, occupied)

            // Invariante: nenhum slot livre deve se sobrepor a qualquer intervalo ocupado
            for (const slot of free) {
              for (const occ of occupied) {
                const overlaps =
                  slot.startAt.getTime() < occ.endAt.getTime() &&
                  slot.endAt.getTime()   > occ.startAt.getTime()

                expect(overlaps).toBe(false)
              }
            }
          },
        ),
      )
    },
  )

  it(
    'filterConflicts: todos os slots sem conflito são preservados (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          // Slots that do NOT overlap with any occupied interval
          fc.array(
            fc.integer({ min: 0, max: 23 }).map((hour) => ({
              startAt: new Date(Date.UTC(2025, 5, 15, hour, 0, 0)),
              endAt:   new Date(Date.UTC(2025, 5, 15, hour, 30, 0)),
            })),
            { minLength: 0, maxLength: 24 },
          ),
          (slots) => {
            // No occupied intervals → all slots must be preserved
            const free = filterConflicts(slots, [])
            expect(free).toHaveLength(slots.length)
          },
        ),
      )
    },
  )

  it(
    'filterConflicts: slots que conflitam com Appointments PENDING/CONFIRMED são removidos (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2025-01-01T08:00:00Z'),
            max: new Date('2025-12-31T16:00:00Z'),
          }),
          fc.integer({ min: 30, max: 120 }),
          (occupiedStart, durationMinutes) => {
            const occupiedEnd = new Date(occupiedStart.getTime() + durationMinutes * 60_000)

            // A slot that exactly matches the occupied interval
            const conflictingSlot: Slot = {
              startAt: occupiedStart,
              endAt:   occupiedEnd,
            }

            const occupied: TimeInterval[] = [{ startAt: occupiedStart, endAt: occupiedEnd }]

            const free = filterConflicts([conflictingSlot], occupied)

            // The conflicting slot must be removed
            expect(free).toHaveLength(0)
          },
        ),
      )
    },
  )

  it(
    'filterConflicts: slots adjacentes (sem sobreposição) não são removidos (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2025-01-01T08:00:00Z'),
            max: new Date('2025-12-31T14:00:00Z'),
          }),
          fc.integer({ min: 30, max: 120 }),
          (occupiedStart, durationMinutes) => {
            const occupiedEnd = new Date(occupiedStart.getTime() + durationMinutes * 60_000)

            // A slot that ends exactly when the occupied interval starts (adjacent, no overlap)
            const adjacentBefore: Slot = {
              startAt: new Date(occupiedStart.getTime() - durationMinutes * 60_000),
              endAt:   occupiedStart,
            }

            // A slot that starts exactly when the occupied interval ends (adjacent, no overlap)
            const adjacentAfter: Slot = {
              startAt: occupiedEnd,
              endAt:   new Date(occupiedEnd.getTime() + durationMinutes * 60_000),
            }

            const occupied: TimeInterval[] = [{ startAt: occupiedStart, endAt: occupiedEnd }]

            const free = filterConflicts([adjacentBefore, adjacentAfter], occupied)

            // Adjacent slots must NOT be removed
            expect(free).toHaveLength(2)
          },
        ),
      )
    },
  )
})

// ── Property 5: Geração de slots respeita regras ativas ───────────────────────

// Feature: scheduling-system, Property 5: Geração de slots respeita regras ativas
describe('Property 5: Geração de slots respeita regras ativas', () => {
  it(
    'generateSlots: regras com active=false nunca geram slots (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.array(fcInactiveRule, { minLength: 1, maxLength: 5 }),
          fcDateRange,
          fcTimezone,
          (inactiveRules, { from, to }, timezone) => {
            const slots = generateSlots(inactiveRules, from, to, timezone)

            // Invariante: regras inativas não devem gerar nenhum slot
            expect(slots).toHaveLength(0)
          },
        ),
      )
    },
  )

  it(
    'generateSlots: mistura de regras ativas e inativas — apenas regras ativas geram slots (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.array(fcActiveRule,   { minLength: 1, maxLength: 3 }),
          fc.array(fcInactiveRule, { minLength: 1, maxLength: 3 }),
          fcDateRange,
          fcTimezone,
          (activeRules, inactiveRules, { from, to }, timezone) => {
            const allRules = [...activeRules, ...inactiveRules]

            const slotsAll    = generateSlots(allRules,    from, to, timezone)
            const slotsActive = generateSlots(activeRules, from, to, timezone)

            // Invariante: adicionar regras inativas não deve alterar o resultado
            expect(slotsAll).toHaveLength(slotsActive.length)

            // Verify timestamps match exactly
            for (let i = 0; i < slotsAll.length; i++) {
              expect(slotsAll[i].startAt.getTime()).toBe(slotsActive[i].startAt.getTime())
              expect(slotsAll[i].endAt.getTime()).toBe(slotsActive[i].endAt.getTime())
            }
          },
        ),
      )
    },
  )

  it(
    'generateSlots: sem regras ativas retorna lista vazia (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcDateRange,
          fcTimezone,
          ({ from, to }, timezone) => {
            const slots = generateSlots([], from, to, timezone)
            expect(slots).toHaveLength(0)
          },
        ),
      )
    },
  )

  it(
    'generateSlots: slots gerados têm duração exatamente igual a slotMinutes (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcActiveRule,
          fcDateRange,
          fcTimezone,
          (rule, { from, to }, timezone) => {
            const slots = generateSlots([rule], from, to, timezone)
            const expectedDurationMs = rule.slotMinutes * 60_000

            for (const slot of slots) {
              const actualDurationMs = slot.endAt.getTime() - slot.startAt.getTime()
              expect(actualDurationMs).toBe(expectedDurationMs)
            }
          },
        ),
      )
    },
  )

  it(
    'generateSlots: slots gerados caem apenas nos weekdays das regras ativas (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 6 }),
          fcValidTimePair,
          fc.integer({ min: 15, max: 60 }),
          fcTimezone,
          (weekday, [startTime, endTime], slotMinutes, timezone) => {
            const rule: AvailabilityRuleInput = {
              weekday,
              startTime,
              endTime,
              slotMinutes,
              active: true,
            }

            // Use a 7-day window starting from a known Monday (2025-01-06)
            const from = new Date('2025-01-06T00:00:00Z')
            const to   = new Date('2025-01-12T00:00:00Z')

            const slots = generateSlots([rule], from, to, timezone)

            // Each slot's UTC day must correspond to the rule's weekday
            // (accounting for timezone offset: the local day may differ from UTC day)
            for (const slot of slots) {
              // Convert slot start back to local time to check the weekday
              const localDate = toZonedTime(slot.startAt, timezone)
              expect(localDate.getDay()).toBe(weekday)
            }
          },
        ),
      )
    },
  )
})

// ── Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local ──

// Feature: scheduling-system, Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local
describe('Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local', () => {
  it(
    'slots gerados em UTC, convertidos de volta ao timezone do artista, caem dentro da janela [startTime, endTime) (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcActiveRule,
          fcDateRange,
          fcTimezone,
          (rule, { from, to }, timezone) => {
            const slots = generateSlots([rule], from, to, timezone)

            const [startH, startM] = rule.startTime.split(':').map(Number)
            const [endH,   endM  ] = rule.endTime.split(':').map(Number)

            const windowStartMinutes = startH * 60 + startM
            const windowEndMinutes   = endH   * 60 + endM

            for (const slot of slots) {
              // Convert UTC slot start back to the artist's local timezone
              const localStart = toZonedTime(slot.startAt, timezone)
              const localEnd   = toZonedTime(slot.endAt,   timezone)

              const slotStartMinutes = localStart.getHours() * 60 + localStart.getMinutes()
              const slotEndMinutes   = localEnd.getHours()   * 60 + localEnd.getMinutes()

              // Invariante: slot start must be >= window start (in local time)
              expect(slotStartMinutes).toBeGreaterThanOrEqual(windowStartMinutes)

              // Invariante: slot end must be <= window end (in local time)
              // Note: slotEndMinutes === 0 means midnight (00:00), which represents end-of-day
              // when endTime is "24:00" equivalent — treat 0 as 1440 for boundary check
              const normalizedSlotEnd = slotEndMinutes === 0 ? 1440 : slotEndMinutes
              expect(normalizedSlotEnd).toBeLessThanOrEqual(windowEndMinutes)
            }
          },
        ),
      )
    },
  )

  it(
    'slots gerados em UTC têm startAt < endAt (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fcActiveRule,
          fcDateRange,
          fcTimezone,
          (rule, { from, to }, timezone) => {
            const slots = generateSlots([rule], from, to, timezone)

            for (const slot of slots) {
              expect(slot.startAt.getTime()).toBeLessThan(slot.endAt.getTime())
            }
          },
        ),
      )
    },
  )

  it(
    'UTC → local → UTC round-trip: timezone America/Sao_Paulo (UTC-3) (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          // Use a rule on Monday (weekday=1) with a fixed time window
          fc.integer({ min: 15, max: 60 }),
          (slotMinutes) => {
            const timezone = 'America/Sao_Paulo'
            const rule: AvailabilityRuleInput = {
              weekday:     1, // Monday
              startTime:   '09:00',
              endTime:     '12:00',
              slotMinutes,
              active:      true,
            }

            // 2025-01-06 is a Monday
            const from = new Date('2025-01-06T00:00:00Z')
            const to   = new Date('2025-01-06T00:00:00Z')

            const slots = generateSlots([rule], from, to, timezone)

            // America/Sao_Paulo is UTC-3 in January (no DST)
            // 09:00 local = 12:00 UTC, 12:00 local = 15:00 UTC
            for (const slot of slots) {
              const localStart = toZonedTime(slot.startAt, timezone)
              const localEnd   = toZonedTime(slot.endAt,   timezone)

              const startMinutes = localStart.getHours() * 60 + localStart.getMinutes()
              const endMinutes   = localEnd.getHours()   * 60 + localEnd.getMinutes()

              // Must be within [09:00, 12:00) in local time
              expect(startMinutes).toBeGreaterThanOrEqual(9 * 60)
              expect(endMinutes).toBeLessThanOrEqual(12 * 60)
            }
          },
        ),
      )
    },
  )

  it(
    'UTC → local → UTC round-trip: timezone Asia/Tokyo (UTC+9) (mínimo 100 iterações)',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 15, max: 60 }),
          (slotMinutes) => {
            const timezone = 'Asia/Tokyo'
            const rule: AvailabilityRuleInput = {
              weekday:     3, // Wednesday
              startTime:   '10:00',
              endTime:     '18:00',
              slotMinutes,
              active:      true,
            }

            // 2025-01-08 is a Wednesday
            const from = new Date('2025-01-08T00:00:00Z')
            const to   = new Date('2025-01-08T00:00:00Z')

            const slots = generateSlots([rule], from, to, timezone)

            for (const slot of slots) {
              const localStart = toZonedTime(slot.startAt, timezone)
              const localEnd   = toZonedTime(slot.endAt,   timezone)

              const startMinutes = localStart.getHours() * 60 + localStart.getMinutes()
              const endMinutes   = localEnd.getHours()   * 60 + localEnd.getMinutes()

              expect(startMinutes).toBeGreaterThanOrEqual(10 * 60)
              expect(endMinutes).toBeLessThanOrEqual(18 * 60)
            }
          },
        ),
      )
    },
  )
})
