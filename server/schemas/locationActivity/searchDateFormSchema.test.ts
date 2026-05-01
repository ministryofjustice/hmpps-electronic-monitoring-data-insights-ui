import { searchLocationsQuerySchema } from './searchDateFormSchema'

describe('searchLocationsQuerySchema', () => {
  it('should reject empty hour and minute values', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '01/01/2025',
        hour: '',
        minute: '',
      },
      end: {
        date: '02/01/2025',
        hour: '',
        minute: '',
      },
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      const { issues } = result.error
      expect(issues).toHaveLength(4)

      expect(issues[0]).toMatchObject({
        code: 'too_small',
        message: 'You must enter a time from hour',
        path: ['start', 'hour'],
      })

      expect(issues[1]).toMatchObject({
        code: 'too_small',
        message: 'You must enter a time from minute',
        path: ['start', 'minute'],
      })

      expect(issues[2]).toMatchObject({
        code: 'too_small',
        message: 'You must enter a time to hour',
        path: ['end', 'hour'],
      })

      expect(issues[3]).toMatchObject({
        code: 'too_small',
        message: 'You must enter a time to minute',
        path: ['end', 'minute'],
      })
    }
  })
  it('should reject invalid date values', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '00/01/2025',
        hour: '1',
        minute: '1',
      },
      end: {
        date: '02/30/2025',
        hour: '1',
        minute: '1',
      },
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      const { issues } = result.error
      expect(issues).toHaveLength(2)

      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: 'You must enter a valid From date and time',
      })

      expect(issues[1]).toMatchObject({
        code: 'custom',
        message: 'You must enter a valid to date and time',
      })
    }
  })
  it('should pass with valid date, hour and minute values', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '01/01/2025',
        hour: '1',
        minute: '1',
      },
      end: {
        date: '02/01/2025',
        hour: '1',
        minute: '1',
      },
    })

    expect(result.success).toBe(true)
  })
  it('should fail when all date and time values are the same', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '01/01/2025',
        hour: '1',
        minute: '1',
      },
      end: {
        date: '01/01/2025',
        hour: '1',
        minute: '1',
      },
    })
    expect(result.success).toBe(false)
  })
  it('should reject when end date and time is before start date and time', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '02/01/2025',
        hour: '1',
        minute: '1',
      },
      end: {
        date: '01/01/2025',
        hour: '1',
        minute: '1',
      },
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      const { issues } = result.error
      expect(issues).toHaveLength(1)

      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: 'To date and time must be after the from date and time',
      })
    }
  })
  it('should pass when end date and time is the same date and different time', () => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '01/01/2025',
        hour: '1',
        minute: '1',
      },
      end: {
        date: '01/01/2025',
        hour: '2',
        minute: '1',
      },
    })

    expect(result.success).toBe(true)
  })
})
