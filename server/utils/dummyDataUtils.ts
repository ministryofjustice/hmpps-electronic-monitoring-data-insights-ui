import { Person, dayMap, CurfewSchedule, FormattedPerson } from '../interfaces/dummyDataPerson'

export const getNameFromPersonObject = (person: Person): string =>
  `${person.first_name}${person.middle_name ? ` ${person.middle_name}` : ''} ${person.last_name}`

export const getDateStringFromDateObject = (dateObj: { year: number; month: number; day: number }): string => {
  const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const getDOBInformationFromDateObject = (dateObj: { year: number; month: number; day: number }): string => {
  const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day)
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1
  }
  return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (${age} years old)`
}

export const getDisabilitiesList = (disabilities: string): string[] => {
  if (disabilities.startsWith('[') && disabilities.endsWith(']')) {
    return disabilities
      .slice(1, -1)
      .split(`',`)
      .map(item => item.trim().replace(/^'+|'+$/g, ''))
  }
  return [disabilities]
}

function getDaysLeft(dateObj: { year: number; month: number; day: number }): string {
  const target = new Date(dateObj.year, dateObj.month - 1, dateObj.day)
  const today = new Date()
  // Zero out time for accurate day calculation
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  return `${diffDays} day${diffDays === 1 ? '' : 's'} left`
}

function formatTime(hour: number, minute: number): string {
  const ampm = hour < 12 ? 'am' : 'pm'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}${minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`}${ampm}`
}

function formatCurfewSchedule(curfewSchedule: CurfewSchedule[]): { key: string; value: string }[] {
  return curfewSchedule.map(schedule => {
    const days = schedule.curfew_days
    const value = `${formatTime(schedule.start_time.hour, schedule.start_time.minute)} to ${formatTime(schedule.end_time.hour, schedule.end_time.minute)}`
    const key = days.length > 0 ? `${dayMap[days[0]]} to ${dayMap[days[days.length - 1]]}` : dayMap[days[0]]
    return { key, value }
  })
}

export const getFormattedPerson = (person: Person): FormattedPerson => {
  return {
    ...person,
    full_name: getNameFromPersonObject(person),
    date_of_birth_string: getDOBInformationFromDateObject(person.date_of_birth),
    disabilities: getDisabilitiesList(person.disabilities_and_health_conditions),
    order_start_date_string: getDateStringFromDateObject(person.order_start_date),
    order_end_date_string: getDateStringFromDateObject(person.order_end_date),
    order_days_left: getDaysLeft(person.order_end_date),
    device_installed_date_time_string: getDateStringFromDateObject(person.device_installed_date_time),
    release_date_string: getDateStringFromDateObject(person.release_date),
    curfew: formatCurfewSchedule(person.curfew_schedule),
  }
}
