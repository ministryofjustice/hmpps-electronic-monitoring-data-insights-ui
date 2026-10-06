import { z } from 'zod'
import { parseDateTimeFromComponents } from '../../utils/date'

const MESSAGES = {
  dateRequired: (label: 'from' | 'to') => `Select or enter a 'date ${label}'`,
  dateFormat: 'Enter date in the format DD/MM/YYYY',
  dateInvalidCalendar: 'Enter a correct date',
  hourRequired: (label: 'from' | 'to') => `Enter an hour for 'time ${label}'`,
  hourInvalid: 'Enter a correct hour',
  minuteRequired: (label: 'from' | 'to') => `Enter the minutes for 'time ${label}'`,
  timeRequired: (label: 'from' | 'to') => `Enter a 'time ${label}'`,
  minuteInvalid: 'Enter the correct minutes',
  dateFutureFrom: `Enter a 'date from' that is today or in the past`,
  dateFutureTo: `Enter a 'date to' that is today or in the past`,
  timeFutureFrom: `Enter a 'time from' that is in the past`,
  timeFutureTo: `Enter a 'time to' that is in the past`,
  timeToAfterTimeFrom: `'Time to' must be after 'time from'`,
  dateToAfterDateFrom: `'Date to' must be after 'date from'`,
  rangeMustNotBeIdentical: `'Date from' and 'time from' must be earlier than 'date to' and 'time to'`,
}

const MIN_YEAR = 2000
const MAX_YEAR = 2999

const DATE_FORMAT_REGEX = /^\d{1,2}\/\d{1,2}\/\d{4}$/

const isIntegerInRange = (value: string, minimum: number, maximum: number): boolean => {
  const trimmedValue = value.trim()
  return /^\d+$/.test(trimmedValue) && Number(trimmedValue) >= minimum && Number(trimmedValue) <= maximum
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

const todayFormatted = (): string => {
  const now = new Date()
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`
}

const isCalendarDateValid = (dateStr: string): boolean => {
  const year = Number(dateStr.split('/')[2])
  if (year < MIN_YEAR || year > MAX_YEAR) return false
  return parseDateTimeFromComponents(dateStr, '0', '0').isValid()
}

const isDateInFuture = (dateStr: string): boolean => {
  const inputDateOnly = parseDateTimeFromComponents(dateStr, '0', '0')
  const todayDateOnly = parseDateTimeFromComponents(todayFormatted(), '0', '0')
  return inputDateOnly.valueOf() > todayDateOnly.valueOf()
}

const isDateTimeInFuture = (dateStr: string, hour: string, minute: string): boolean => {
  const parsed = parseDateTimeFromComponents(dateStr, hour, minute)
  return parsed.valueOf() > Date.now()
}

const createDateSchema = (label: 'From' | 'To') => {
  const lowerLabel = label.toLowerCase() as 'from' | 'to'

  return z.string().superRefine((value, ctx) => {
    const trimmed = value.trim()

    if (trimmed === '') {
      ctx.addIssue({ code: 'custom', message: MESSAGES.dateRequired(lowerLabel) })
      return
    }

    if (!DATE_FORMAT_REGEX.test(trimmed)) {
      ctx.addIssue({ code: 'custom', message: MESSAGES.dateFormat })
      return
    }

    if (!isCalendarDateValid(trimmed)) {
      ctx.addIssue({ code: 'custom', message: MESSAGES.dateInvalidCalendar })
    }
  })
}

const isDateFieldValid = (dateStr: string): boolean => {
  const trimmed = dateStr.trim()
  if (trimmed === '' || !DATE_FORMAT_REGEX.test(trimmed)) return false
  return isCalendarDateValid(trimmed)
}

const createDateTimeSchema = (label: 'From' | 'To') =>
  z.object({
    date: createDateSchema(label),
    hour: z.string(),
    minute: z.string(),
  })

const dateTimeQuerySchema = z.object({
  date: z.string(),
  hour: z.string(),
  minute: z.string(),
})

type Side = 'start' | 'end'
const SIDES: Array<{ key: Side; label: 'from' | 'to' }> = [
  { key: 'start', label: 'from' },
  { key: 'end', label: 'to' },
]

const searchLocationsQueryValidationSchema = z
  .object({
    start: createDateTimeSchema('From'),
    end: createDateTimeSchema('To'),
  })
  .superRefine((data, ctx) => {
    const timeValidBySide: Record<Side, boolean> = { start: false, end: false }
    const dateValidBySide: Record<Side, boolean> = { start: false, end: false }

    const addTimeIssue = (side: Side, message: string) => {
      ctx.addIssue({ code: 'custom', message, path: [side, 'hour'] })
      ctx.addIssue({
        code: 'custom',
        message,
        path: [side, 'minute'],
        params: { highlightOnly: true },
      })
    }

    SIDES.forEach(({ key, label }) => {
      const { hour, minute } = data[key]
      const hourTrim = hour.trim()
      const minuteTrim = minute.trim()
      const hourEmpty = hourTrim === ''
      const minuteEmpty = minuteTrim === ''

      if (hourEmpty && minuteEmpty) {
        addTimeIssue(key, MESSAGES.timeRequired(label))
      } else {
        let hourValid = false
        let minuteValid = false

        if (hourEmpty) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.hourRequired(label), path: [key, 'hour'] })
        } else if (!isIntegerInRange(hourTrim, 0, 23)) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.hourInvalid, path: [key, 'hour'] })
        } else {
          hourValid = true
        }

        if (minuteEmpty) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.minuteRequired(label), path: [key, 'minute'] })
        } else if (!isIntegerInRange(minuteTrim, 0, 59)) {
          ctx.addIssue({ code: 'custom', message: MESSAGES.minuteInvalid, path: [key, 'minute'] })
        } else {
          minuteValid = true
        }

        timeValidBySide[key] = hourValid && minuteValid
      }

      dateValidBySide[key] = isDateFieldValid(data[key].date)
    })

    SIDES.forEach(({ key, label }) => {
      if (!dateValidBySide[key]) return

      const { date, hour, minute } = data[key]
      const dateTrim = date.trim()

      if (isDateInFuture(dateTrim)) {
        ctx.addIssue({
          code: 'custom',
          message: label === 'from' ? MESSAGES.dateFutureFrom : MESSAGES.dateFutureTo,
          path: [key, 'date'],
        })
        return
      }

      if (timeValidBySide[key] && isDateTimeInFuture(dateTrim, hour.trim(), minute.trim())) {
        addTimeIssue(key, label === 'from' ? MESSAGES.timeFutureFrom : MESSAGES.timeFutureTo)
      }
    })

    if (!dateValidBySide.start || !dateValidBySide.end || !timeValidBySide.start || !timeValidBySide.end) {
      return
    }

    const fromParsed = parseDateTimeFromComponents(data.start.date, data.start.hour, data.start.minute)
    const toParsed = parseDateTimeFromComponents(data.end.date, data.end.hour, data.end.minute)

    if (!fromParsed.isValid() || !toParsed.isValid()) {
      return
    }

    const sameDate = data.start.date.trim() === data.end.date.trim()

    if (sameDate && toParsed.valueOf() < fromParsed.valueOf()) {
      addTimeIssue('end', MESSAGES.timeToAfterTimeFrom)
      return
    }

    if (toParsed.valueOf() < fromParsed.valueOf()) {
      ctx.addIssue({
        code: 'custom',
        message: MESSAGES.dateToAfterDateFrom,
        path: ['end', 'date'],
      })
      return
    }

    if (toParsed.valueOf() === fromParsed.valueOf()) {
      ctx.addIssue({
        code: 'custom',
        message: MESSAGES.rangeMustNotBeIdentical,
        path: ['start', 'date'],
      })
    }
  })

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
