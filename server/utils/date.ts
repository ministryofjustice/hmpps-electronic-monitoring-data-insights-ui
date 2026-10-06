import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

const pad2 = (v: string) => v.trim().padStart(2, '0')

const parseDateTimeFromComponents = (date: string, hour: string, minute: string, second?: string) => {
  const dateTrim = date?.trim() ?? ''
  const hourTrim = hour?.trim() ?? ''
  const minuteTrim = minute?.trim() ?? ''
  const secondTrim = second?.trim() ?? ''

  if (!dateTrim || !hourTrim || !minuteTrim) return dayjs(null)

  const [d = '', m = '', y = ''] = dateTrim.split('/')
  const normalisedDate = `${pad2(d)}/${pad2(m)}/${y}`
  const time = secondTrim
    ? `${pad2(hourTrim)}:${pad2(minuteTrim)}:${pad2(secondTrim)}`
    : `${pad2(hourTrim)}:${pad2(minuteTrim)}`
  const format = secondTrim ? 'DD/MM/YYYY HH:mm:ss' : 'DD/MM/YYYY HH:mm'
  const input = `${normalisedDate} ${time}`

  if (!dayjs(input, format, true).isValid()) return dayjs(null)

  return dayjs.tz(input, format, 'Europe/London')
}

const parseDateTimeFromISOString = (dateString: string) => {
  if (!dateString) return dayjs(null)
  const date = dayjs(dateString)
  return date.isValid() ? date : dayjs(null)
}

const getDateComponents = (date: Dayjs) => {
  if (date?.isValid()) {
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

  if (!date?.isValid()) {
    return ''
  }

  return date.tz('Europe/London').format('DD/MM/YYYY HH:mm')
}

const formatGpsDate = (datetime?: string | null): string => {
  if (!datetime) return ''

  const date = dayjs(datetime)

  if (!date?.isValid()) return ''

  return date.tz('Europe/London').format('DD MMM YYYY, HH:mm')
}

const formatDob = (dateString?: string | null): string => {
  if (!dateString) return ''

  const date = dayjs(dateString)
  return date?.isValid() ? date.format('DD/MM/YYYY') : ''
}

const calculateAge = (dateString?: string | null): number | null => {
  if (!dateString) return null

  const dateOfBirth = dayjs(dateString, ['YYYY-MM-DD', 'D/M/YYYY', 'DD/MM/YYYY'], true)

  if (!dateOfBirth?.isValid()) return null

  const today = dayjs().tz('Europe/London').startOf('day')

  const dateOfBirthYear = dateOfBirth.year()
  const dateOfBirthMonth = dateOfBirth.month()
  const dateOfBirthDate = dateOfBirth.date()
  const todayYear = today.year()
  const todayMonth = today.month()
  const todayDate = today.date()

  if (
    dateOfBirthYear > todayYear ||
    (dateOfBirthYear === todayYear && dateOfBirthMonth > todayMonth) ||
    (dateOfBirthYear === todayYear && dateOfBirthMonth === todayMonth && dateOfBirthDate > todayDate)
  ) {
    return null
  }

  let age = todayYear - dateOfBirthYear

  if (dateOfBirthMonth > todayMonth || (dateOfBirthMonth === todayMonth && dateOfBirthDate > todayDate)) {
    age -= 1
  }

  return age
}

const formatSyncDate = (datetime?: string | null): string => {
  if (!datetime) return ''

  const date = dayjs(datetime)
  if (!date?.isValid()) return ''

  return date.tz('Europe/London').format('D MMMM YYYY')
}

const formatSyncTime = (datetime?: string | null): string => {
  if (!datetime) return ''

  const date = dayjs(datetime)
  if (!date?.isValid()) return ''

  return date.tz('Europe/London').format('HH:mm')
}

export {
  parseDateTimeFromComponents,
  parseDateTimeFromISOString,
  getDateComponents,
  calculateAge,
  formatDate,
  formatDob,
  formatGpsDate,
  formatSyncDate,
  formatSyncTime,
}
