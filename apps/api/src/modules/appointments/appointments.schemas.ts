import { z } from 'zod'

export const AppointmentStatus = {
  PENDING:   'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REJECTED:  'REJECTED',
} as const

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const MAX_PERIOD_DAYS = 60
const MS_PER_DAY      = 1000 * 60 * 60 * 24

export const CreateAppointmentSchema = z.object({
  artistId:       z.string().uuid(),
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
)

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']),
})

export const AppointmentQuerySchema = z.object({
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

export type CreateAppointmentBody      = z.infer<typeof CreateAppointmentSchema>
export type UpdateAppointmentStatusBody = z.infer<typeof UpdateAppointmentStatusSchema>
export type AppointmentQuery           = z.infer<typeof AppointmentQuerySchema>
