import { z } from 'zod'
import { parseDateTimeFromComponents } from '../../utils/date'

const dateTimeQuerySchema = z.object({
  date: z.string().min(8, 'Date must be DD/MM/YYYY'),
  hour: z
    .string()
    .trim()
    .min(1, 'You must enter an hour')
    .refine(val => !Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 23, {
      message: 'Hour must be between 00 and 23',
    }),
  minute: z
    .string()
    .trim()
    .min(1, 'You must enter a minute')
    .refine(val => !Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 59, {
      message: 'Minute must be between 00 and 59',
    }),
})

const searchLocationsQueryValidationSchema = z
  .object({
    start: dateTimeQuerySchema,
    end: dateTimeQuerySchema,
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
      message: 'You must enter a valid start date and time',
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
      message: 'You must enter a valid end date and time',
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
      message: 'End date and time must be after start date and time',
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
