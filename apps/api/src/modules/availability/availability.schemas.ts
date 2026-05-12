import { z } from 'zod'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export const CreateAvailabilityRuleSchema = z.object({
  weekday:     z.number().int().min(0).max(6),
  startTime:   z.string().regex(TIME_REGEX, 'startTime must be in HH:MM format'),
  endTime:     z.string().regex(TIME_REGEX, 'endTime must be in HH:MM format'),
  slotMinutes: z.number().int().positive(),
  active:      z.boolean().default(true),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'startTime must be before endTime', path: ['startTime'] },
)

export const UpdateAvailabilityRuleSchema = z.object({
  weekday:     z.number().int().min(0).max(6).optional(),
  startTime:   z.string().regex(TIME_REGEX, 'startTime must be in HH:MM format').optional(),
  endTime:     z.string().regex(TIME_REGEX, 'endTime must be in HH:MM format').optional(),
  slotMinutes: z.number().int().positive().optional(),
  active:      z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startTime !== undefined && data.endTime !== undefined) {
      return data.startTime < data.endTime
    }
    return true
  },
  { message: 'startTime must be before endTime', path: ['startTime'] },
)

export const CreateAvailabilityBlockSchema = z.object({
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 datetime' }),
  endAt:   z.string().datetime({ message: 'endAt must be a valid ISO 8601 datetime' }),
  reason:  z.string().optional(),
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  { message: 'startAt must be before endAt', path: ['startAt'] },
)

export const UpdateAvailabilityBlockSchema = z.object({
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 datetime' }).optional(),
  endAt:   z.string().datetime({ message: 'endAt must be a valid ISO 8601 datetime' }).optional(),
  reason:  z.string().optional(),
}).refine(
  (data) => {
    if (data.startAt !== undefined && data.endAt !== undefined) {
      return new Date(data.startAt) < new Date(data.endAt)
    }
    return true
  },
  { message: 'startAt must be before endAt', path: ['startAt'] },
)

export type CreateAvailabilityRuleBody  = z.infer<typeof CreateAvailabilityRuleSchema>
export type UpdateAvailabilityRuleBody  = z.infer<typeof UpdateAvailabilityRuleSchema>
export type CreateAvailabilityBlockBody = z.infer<typeof CreateAvailabilityBlockSchema>
export type UpdateAvailabilityBlockBody = z.infer<typeof UpdateAvailabilityBlockSchema>
