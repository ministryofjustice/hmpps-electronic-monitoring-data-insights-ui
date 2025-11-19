import { z } from 'zod/v4'
import { parseDateTimeFromComponents } from '../../utils/date'

const dateTimeQuerySchema = z.object({
  date: z.string().min(8, 'Date must be DD/MM/YYYY'),
  hour: z.string().min(1, 'You must enter an hour'), 
  minute: z.string().min(1, 'You must enter a minute'),
})

const searchLocationsQuerySchema = z
  .object({
    start: dateTimeQuerySchema,
    end: dateTimeQuerySchema,
  })
  .refine(
    (data) => {
      const fromParsed = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
      return fromParsed.isValid()
    },
    {
      message: 'You must enter a valid value for date',
      path: ['start', 'date'],
    }
  )
  .refine(
    (data) => {
      const toParsed = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)
      return toParsed.isValid()
    },
    {
      message: 'You must enter a valid value for date',
      path: ['end', 'date'],
    }
  )
  .transform((data) => {
    const fromDate = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
    const toDate = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)

    return {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    }
  })

const viewLocationsQueryParametersSchema = z.object({
  fromDate: z.string().default(''),
  toDate: z.string().default(''),
})

export { searchLocationsQuerySchema, viewLocationsQueryParametersSchema }