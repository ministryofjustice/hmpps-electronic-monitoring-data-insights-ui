import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

const parseDateTimeFromComponents = (date: string, hour: string, minute: string, second?: string) => {
  const dateTimeString = second ? `${date} ${hour}:${minute}:${second}` : `${date} ${hour}:${minute}`

  const formats = [
    'D/M/YYYY H:m',
    'DD/MM/YYYY H:m',
    'D/M/YYYY HH:mm',
    'DD/MM/YYYY HH:mm',
    'D/M/YYYY H:m:s',
    'DD/MM/YYYY H:m:s',
    'D/M/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
  ]
  const validationDate = dayjs(dateTimeString, formats, true)

  if (!validationDate.isValid()) {
    return dayjs(null)
  }

  return dayjs.tz(dateTimeString, second ? 'D/M/YYYY H:m:s' : 'D/M/YYYY H:m', 'Europe/London')
}

const parseDateTimeFromISOString = (dateString: string) => {
  return dayjs(dateString)
}

const getDateComponents = (date: Dayjs) => {
  if (date.isValid()) {
    const londonDate = date.tz('Europe/London')
    return {
      date: londonDate.format('DD/MM/YYYY'),
      hour: londonDate.format('HH'),
      minute: londonDate.format('mm'),
      second: londonDate.format('ss'),
    }
  }

  return {
    date: 'Invalid date',
    hour: '',
    minute: '',
    second: '',
  }
}

const formatDate = (datetime?: string | null): string => {
  if (!datetime) {
    return ''
  }

  const date = dayjs(datetime)

  if (!date.isValid()) {
    return ''
  }

  return date.tz('Europe/London').format('DD/MM/YYYY HH:mm')
}

const formatDob = (dateString?: string | null): string => {
  if (!dateString) return ''

  const date = dayjs(dateString)
  return date.isValid() ? date.format('DD/MM/YYYY') : ''
}

export { parseDateTimeFromComponents, parseDateTimeFromISOString, getDateComponents, formatDate, formatDob }
