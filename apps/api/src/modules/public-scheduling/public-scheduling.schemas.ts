import { z } from 'zod'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const MAX_PERIOD_DAYS = 60
const MS_PER_DAY      = 1000 * 60 * 60 * 24

const MIN_ADVANCE_MS  = 24 * 60 * 60 * 1000
const MAX_ADVANCE_MS  = 60 * MS_PER_DAY

export const PublicAvailabilityQuerySchema = z.object({
  from: z.string().regex(DATE_REGEX, 'from must be in YYYY-MM-DD format'),
  to:   z.string().regex(DATE_REGEX, 'to must be in YYYY-MM-DD format'),
}).refine(
  (data) => {
    const fromDate = new Date(data.from)
    const toDate   = new Date(data.to)
    const diffDays = (toDate.getTime() - fromDate.getTime()) / MS_PER_DAY
    return diffDays <= MAX_PERIOD_DAYS
  },
  { message: 'Period between from and to must not exceed 60 days', path: ['to'] },
)

export const PublicCreateAppointmentSchema = z.object({
  requesterName:  z.string().min(1).max(100),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().max(20).optional(),
  serviceId:      z.string().uuid().optional(),
  startAt:        z.string().datetime({ message: 'startAt must be a valid ISO 8601 datetime' }),
  endAt:          z.string().datetime({ message: 'endAt must be a valid ISO 8601 datetime' }),
  notes:          z.string().optional(),
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  { message: 'startAt must be before endAt', path: ['startAt'] },
).refine(
  (data) => new Date(data.startAt).getTime() >= Date.now() + MIN_ADVANCE_MS,
  { message: 'startAt must be at least 24 hours in the future', path: ['startAt'] },
).refine(
  (data) => new Date(data.startAt).getTime() <= Date.now() + MAX_ADVANCE_MS,
  { message: 'startAt must be at most 60 days in the future', path: ['startAt'] },
)

export const PublicAppointmentResponseSchema = z.object({
  requestCode: z.string().uuid(),
  status:      z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']),
  startAt:     z.string().datetime(),
  endAt:       z.string().datetime(),
})

export type PublicAvailabilityQuery        = z.infer<typeof PublicAvailabilityQuerySchema>
export type PublicCreateAppointmentBody    = z.infer<typeof PublicCreateAppointmentSchema>
export type PublicAppointmentResponse      = z.infer<typeof PublicAppointmentResponseSchema>
