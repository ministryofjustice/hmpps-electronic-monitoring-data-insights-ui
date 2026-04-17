import {
  formatDate,
  formatDob,
  formatGpsDate,
  getDateComponents,
  parseDateTimeFromComponents,
  parseDateTimeFromISOString,
} from './date'

describe('parseDateTimeFromComponents', () => {
  it('should return a valid dayjs object if all components are provided', () => {
    const result = parseDateTimeFromComponents('01/01/2023', '12', '30')
    expect(result.isValid()).toBe(true)
  })

  it('should return an invalid dayjs object if date is undefined', () => {
    const result = parseDateTimeFromComponents(undefined, undefined, undefined)
    expect(result.isValid()).toBe(false)
  })

  it('should return correct hour and minute components', () => {
    const result = parseDateTimeFromComponents('01/01/2023', '12', '30')
    expect(result.format('HH:mm')).toBe('12:30')
  })

  it('should return a valid dayjs object when seconds are provided', () => {
    const result = parseDateTimeFromComponents('01/01/2023', '12', '30', '45')
    expect(result.isValid()).toBe(true)
    expect(result.format('HH:mm:ss')).toBe('12:30:45')
  })

  it('should return an invalid dayjs object for an invalid date format', () => {
    const result = parseDateTimeFromComponents('not-a-date', '12', '30')
    expect(result.isValid()).toBe(false)
  })
})

describe('parseDateTimeFromISOString', () => {
  it('should return a valid dayjs object if datetime is provided', () => {
    const result = parseDateTimeFromISOString('2023-01-01T12:30:00Z')
    expect(result.isValid()).toBe(true)
  })

  it('should return an invalid dayjs object if datetime is undefined', () => {
    const result = parseDateTimeFromISOString(undefined)
    expect(result.isValid()).toBe(false)
  })

  it('should correctly parse the date components', () => {
    const result = parseDateTimeFromISOString('2023-06-15T09:45:00Z')
    expect(result.format('YYYY-MM-DD')).toBe('2023-06-15')
  })
})

describe('getDateComponents', () => {
  it('should return invalid date components if date is undefined', () => {
    expect(getDateComponents(undefined)).toEqual({
      date: 'Invalid date',
      hour: '',
      minute: '',
      second: '',
    })
  })

  it('should return correct components for a valid date', () => {
    const date = parseDateTimeFromComponents('01/01/2023', '12', '30')
    const result = getDateComponents(date)
    expect(result.date).toBe('01/01/2023')
    expect(result.hour).toBe('12')
    expect(result.minute).toBe('30')
    expect(result.second).toBe('00')
  })

  it('should return an invalid date object for an invalid dayjs object', () => {
    const invalidDate = parseDateTimeFromISOString('not-a-date')
    expect(getDateComponents(invalidDate)).toEqual({
      date: 'Invalid date',
      hour: '',
      minute: '',
      second: '',
    })
  })
})

describe('formatDate', () => {
  it('should return an empty string if datetime is undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('should return an empty string if datetime is null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('should return an empty string for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('should format a valid ISO date string correctly', () => {
    expect(formatDate('2023-01-01T12:30:00Z')).toBe('01/01/2023 12:30')
  })
})

describe('formatDob', () => {
  it('should return an empty string if dateString is undefined', () => {
    expect(formatDob(undefined)).toBe('')
  })

  it('should return an empty string if dateString is null', () => {
    expect(formatDob(null)).toBe('')
  })

  it('should return an empty string for an invalid date string', () => {
    expect(formatDob('not-a-date')).toBe('')
  })

  it('should format a valid date string correctly', () => {
    expect(formatDob('2023-01-01')).toBe('01/01/2023')
  })
})

describe('formatGpsDate', () => {
  it('should format the date correctly', () => {
    expect(formatGpsDate('2023-01-01T00:00:00Z')).toBe('01 Jan 23, 00:00')
  })

  it('should return an empty string if datetime is undefined', () => {
    expect(formatGpsDate(undefined)).toBe('')
  })

  it('should return an empty string if datetime is null', () => {
    expect(formatGpsDate(null)).toBe('')
  })

  it('should return an empty string for an invalid date string', () => {
    expect(formatGpsDate('not-a-date')).toBe('')
  })

  it('should format a mid-year date correctly', () => {
    expect(formatGpsDate('2023-06-15T14:30:00Z')).toBe('15 Jun 23, 15:30')
  })
})
