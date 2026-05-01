import { z } from 'zod'
import { parseDateTimeFromComponents } from '../../utils/date'

const createDateTimeSchema = (label: 'From' | 'To') =>
  z.object({
    date: z.string().min(8, `${label} date must be DD/MM/YYYY`),
    hour: z
      .string()
      .trim()
      .min(1, `You must enter a time ${label.toLowerCase()} hour`)
      .refine(val => !Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 23, {
        message: `${label} hour must be between 00 and 23`,
      }),
    minute: z
      .string()
      .trim()
      .min(1, `You must enter a time ${label.toLowerCase()} minute`)
      .refine(val => !Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 59, {
        message: `${label} minute must be between 00 and 59`,
      }),
  })

const dateTimeQuerySchema = z.object({
  date: z.string(),
  hour: z.string(),
  minute: z.string(),
})

const searchLocationsQueryValidationSchema = z
  .object({
    start: createDateTimeSchema('From'),
    end: createDateTimeSchema('To'),
  })
  .refine(
    data => {
      if (!data.start.hour || !data.start.minute) {
        return true
      }
      const fromParsed = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
      return fromParsed.isValid()
    },
    {
      message: 'You must enter a valid From date and time',
      path: ['start', 'date'],
    },
  )
  .refine(
    data => {
      if (!data.end.hour || !data.end.minute) {
        return true
      }
      const toParsed = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)
      return toParsed.isValid()
    },
    {
      message: 'You must enter a valid to date and time',
      path: ['end', 'date'],
    },
  )
  .refine(
    data => {
      const startHourEmpty = data.start.hour.trim() === ''
      const startMinuteEmpty = data.start.minute.trim() === ''
      const endHourEmpty = data.end.hour.trim() === ''
      const endMinuteEmpty = data.end.minute.trim() === ''

      if (startHourEmpty || startMinuteEmpty || endHourEmpty || endMinuteEmpty) {
        return true
      }

      const fromParsed = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
      const toParsed = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)

      if (!fromParsed.isValid() || !toParsed.isValid()) {
        return true
      }

      return toParsed.valueOf() > fromParsed.valueOf()
    },
    {
      message: 'To date and time must be after the from date and time',
      path: ['end', 'date'],
    },
  )

const searchLocationsQuerySchema = searchLocationsQueryValidationSchema.pipe(
  z
    .object({
      start: dateTimeQuerySchema,
      end: dateTimeQuerySchema,
    })
    .transform(data => {
      const fromDate = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
      const toDate = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)

      return {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      }
    }),
)

const viewLocationsQueryParametersSchema = z.object({
  fromDate: z.string().default(''),
  toDate: z.string().default(''),
})

export { searchLocationsQuerySchema, viewLocationsQueryParametersSchema }
