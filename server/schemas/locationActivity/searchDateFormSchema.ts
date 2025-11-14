import { z } from 'zod/v4'

const dateTimeQuerySchema = z.object({
  date: z.string(),
  hour: z.string(), 
  minute: z.string(), 
})

const searchLocationsQuerySchema = z
  .object({
    start: dateTimeQuerySchema,
    end: dateTimeQuerySchema,
  })
  .transform(data => {
    const parseDateTime = (dt: { date: string; hour: string; minute: string }): Date => {
      const [day, month, year] = dt.date.split('/')
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, 
        parseInt(day, 10),
        parseInt(dt.hour, 10),
        parseInt(dt.minute, 10)
      )
    }

    const startDate = parseDateTime(data.start)
    const endDate = parseDateTime(data.end)

    return {
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString(),
    }
  })

  // .refine(
  //   data => {
  //     const start = new Date(data.fromDate)
  //     const end = new Date(data.toDate)
  //     return start < end
  //   },
  //   {
  //     message: 'Start date/time must be before end date/time',
  //   }
  // )

const viewLocationsQueryParametersSchema = z.object({
  from: z.string().default(''),
  to: z.string().default(''),
})

export { searchLocationsQuerySchema, viewLocationsQueryParametersSchema }