import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import DateTimeInputModel from './dateTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

describe('DateTimeInputModel', () => {
  beforeAll(() => {
    process.env.TZ = 'UTC'
  })

  it('should parse a valid GMT date time', () => {
    const result = DateTimeInputModel.safeParse({ date: '01/01/2025', hour: '0', minute: '0', second: '0' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-01-01T00:00:00.000Z')
  })

  it('should parse a valid BST date time', () => {
    const result = DateTimeInputModel.safeParse({ date: '01/06/2025', hour: '10', minute: '0', second: '0' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-06-01T09:00:00.000Z')
  })

  it('should parse a valid date using D/M/YYYY H:m:s format', () => {
    const result = DateTimeInputModel.safeParse({ date: '1/1/2025', hour: '0', minute: '1', second: '2' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-01-01T00:01:02.000Z')
  })

  it('should parse a valid date using D/M/YYYY HH:mm:ss format', () => {
    const result = DateTimeInputModel.safeParse({ date: '1/1/2025', hour: '00', minute: '01', second: '02' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-01-01T00:01:02.000Z')
  })

  it('should parse a valid date using DD/MM/YYYY H:m:s format', () => {
    const result = DateTimeInputModel.safeParse({ date: '01/01/2025', hour: '0', minute: '1', second: '2' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-01-01T00:01:02.000Z')
  })

  it('should parse a valid date using DD/MM/YYYY HH:mm:ss format', () => {
    const result = DateTimeInputModel.safeParse({ date: '01/01/2025', hour: '00', minute: '01', second: '02' })

    expect(result.success).toBe(true)
    expect(result.data?.toISOString()).toBe('2025-01-01T00:01:02.000Z')
  })

  it('should return an error when the date value is an empty string', () => {
    const result = DateTimeInputModel.safeParse({
      date: '',
      hour: '1',
      minute: '1',
      second: '1',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toStrictEqual([
      {
        code: 'custom',
        message: 'You must enter a valid value for date',
        path: [],
      },
    ])
  })

  it('should return an error when the hour value is an empty string', () => {
    const result = DateTimeInputModel.safeParse({
      date: '01/01/2025',
      hour: '',
      minute: '1',
      second: '1',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toStrictEqual([
      {
        code: 'custom',
        message: 'You must enter a valid value for date',
        path: [],
      },
    ])
  })

  it('should return an error when the minute value is an empty string', () => {
    const result = DateTimeInputModel.safeParse({
      date: '01/01/2025',
      hour: '1',
      minute: '',
      second: '1',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toStrictEqual([
      {
        code: 'custom',
        message: 'You must enter a valid value for date',
        path: [],
      },
    ])
  })

  it('should return an error when the second value is an empty string', () => {
    const result = DateTimeInputModel.safeParse({
      date: '01/01/2025',
      hour: '1',
      minute: '1',
      second: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toStrictEqual([
      {
        code: 'custom',
        message: 'You must enter a valid value for date',
        path: [],
      },
    ])
  })

  it('should return an error when the date value is not a valid date', () => {
    const result = DateTimeInputModel.safeParse({
      date: '00/01/2025',
      hour: '0',
      minute: '0',
      second: '0',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues).toStrictEqual([
      {
        code: 'custom',
        message: 'You must enter a valid value for date',
        path: [],
      },
    ])
  })
})
