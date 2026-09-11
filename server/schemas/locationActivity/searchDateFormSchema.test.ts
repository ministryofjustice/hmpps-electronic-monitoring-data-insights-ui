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
        message: `Enter an hour for 'time from'`,
        path: ['start', 'hour'],
      })

      expect(issues[1]).toMatchObject({
        code: 'too_small',
        message: `Enter a 'time from'`,
        path: ['start', 'minute'],
      })

      expect(issues[2]).toMatchObject({
        code: 'too_small',
        message: `Enter an hour for 'time to'`,
        path: ['end', 'hour'],
      })

      expect(issues[3]).toMatchObject({
        code: 'too_small',
        message: `Enter a 'time to'`,
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
  it.each([
    ['out-of-range hour', '25'],
    ['fractional hour', '1.5'],
  ])('should only reject the time field for an %s', (_description, hour) => {
    const result = searchLocationsQuerySchema.safeParse({
      start: {
        date: '01/01/2025',
        hour,
        minute: '1',
      },
      end: {
        date: '02/01/2025',
        hour: '1',
        minute: '1',
      },
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0]).toMatchObject({
        message: 'Enter a correct hour',
        path: ['start', 'hour'],
      })
      expect(result.error.issues).not.toContainEqual(expect.objectContaining({ path: ['start', 'date'] }))
    }
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
        message: `'Date to' must be after 'date from'`,
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

  it('should reject when start and end date and time are exactly the same', () => {
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

    if (!result.success) {
      const { issues } = result.error
      expect(issues).toHaveLength(1)

      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: `'Date from' and 'time from' must be earlier than 'date to' and 'time to'`,
        path: ['start', 'date'],
      })
    }
  })
})
