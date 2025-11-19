import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'


dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrBefore)

const parseDateTimeFromComponents = (date: string, hour: string, minute: string) => {
  const dateTimeString = `${date} ${hour}:${minute}`
  const formats = ['D/M/YYYY H:m', 'DD/MM/YYYY H:m', 'D/M/YYYY HH:mm', 'DD/MM/YYYY HH:mm']

  const validationDate = dayjs(dateTimeString, formats, true)

  if (!validationDate.isValid()) {
    return dayjs(null)
  }

  return validationDate.tz('Europe/London')
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
      minute: londonDate.format('mm')
    }
  }

  return {
    date: 'Invalid date',
    hour: '',
    minute: ''
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

export { parseDateTimeFromComponents, parseDateTimeFromISOString, getDateComponents, formatDate }
