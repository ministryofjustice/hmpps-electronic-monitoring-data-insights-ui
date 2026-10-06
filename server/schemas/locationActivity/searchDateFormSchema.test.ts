import { searchLocationsQuerySchema, viewLocationsQueryParametersSchema } from './searchDateFormSchema'

type TimeInput = { date: string; hour: string; minute: string }
type ParseResult = ReturnType<typeof searchLocationsQuerySchema.safeParse>

const NOW = new Date('2026-10-05T12:00:00Z')
const TODAY = '05/10/2026'
const TOMORROW = '06/10/2026'
const DAY_AFTER_TOMORROW = '07/10/2026'

const validStart: TimeInput = { date: '01/01/2025', hour: '10', minute: '00' }
const validEnd: TimeInput = { date: '02/01/2025', hour: '10', minute: '00' }

const parse = (start: Partial<TimeInput> = {}, end: Partial<TimeInput> = {}): ParseResult =>
  searchLocationsQuerySchema.safeParse({
    start: { ...validStart, ...start },
    end: { ...validEnd, ...end },
  })

const getData = (result: ParseResult) => {
  if (!result.success) {
    throw new Error(`Expected validation to pass: ${JSON.stringify(result.error.issues)}`)
  }
  return result.data
}

const getIssues = (result: ParseResult) => {
  if (result.success) {
    throw new Error('Expected validation to fail')
  }
  return result.error.issues
}

describe('searchLocationsQuerySchema', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('valid input', () => {
    it('should pass with valid date, hour and minute values', () => {
      expect(parse({ hour: '1', minute: '1' }, { hour: '1', minute: '1' }).success).toBe(true)
    })

    it('should pass when end is the same date and a later time', () => {
      const result = parse(
        { date: '01/01/2025', hour: '1', minute: '1' },
        { date: '01/01/2025', hour: '2', minute: '1' },
      )
      expect(result.success).toBe(true)
    })

    it('should accept the boundary hour and minute values', () => {
      const result = parse({ hour: '0', minute: '0' }, { hour: '23', minute: '59' })
      expect(result.success).toBe(true)
    })

    it('should accept the minimum valid year', () => {
      const result = parse({ date: '01/01/2000' })
      expect(result.success).toBe(true)
    })

    it('should accept a time earlier today', () => {
      const result = parse({ date: TODAY, hour: '9', minute: '0' }, { date: TODAY, hour: '10', minute: '0' })
      expect(result.success).toBe(true)
    })
  })

  describe('output transform', () => {
    it('should convert London time to ISO strings during BST', () => {
      const result = parse(
        { date: '01/07/2025', hour: '10', minute: '00' },
        { date: '02/07/2025', hour: '10', minute: '00' },
      )

      expect(getData(result)).toEqual({
        fromDate: '2025-07-01T09:00:00.000Z',
        toDate: '2025-07-02T09:00:00.000Z',
      })
    })

    it('should convert London time to ISO strings during GMT', () => {
      const result = parse(
        { date: '01/01/2025', hour: '10', minute: '00' },
        { date: '02/01/2025', hour: '10', minute: '00' },
      )

      expect(getData(result)).toEqual({
        fromDate: '2025-01-01T10:00:00.000Z',
        toDate: '2025-01-02T10:00:00.000Z',
      })
    })

    it('should accept unpadded day, month, hour and minute values', () => {
      const result = parse({ date: '1/7/2025', hour: '9', minute: '5' }, { date: '2/7/2025', hour: '9', minute: '5' })

      expect(getData(result)).toEqual({
        fromDate: '2025-07-01T08:05:00.000Z',
        toDate: '2025-07-02T08:05:00.000Z',
      })
    })
  })

  describe('date field', () => {
    it('should require a date from', () => {
      const issues = getIssues(parse({ date: '' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: "Select or enter a 'date from'",
        path: ['start', 'date'],
      })
    })

    it('should require a date to', () => {
      const issues = getIssues(parse({}, { date: '' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        message: "Select or enter a 'date to'",
        path: ['end', 'date'],
      })
    })

    it('should treat a whitespace-only date as missing', () => {
      const issues = getIssues(parse({ date: '   ' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: "Select or enter a 'date from'" })
    })

    it.each([['2025-01-01'], ['1/1/25'], ['abc'], ['01-01-2025'], ['1/1/2025/1']])(
      'should reject the date format %s',
      date => {
        const issues = getIssues(parse({ date }))

        expect(issues).toHaveLength(1)
        expect(issues[0]).toMatchObject({
          message: 'Enter date in the format DD/MM/YYYY',
          path: ['start', 'date'],
        })
      },
    )

    it.each([['00/01/2025'], ['31/02/2025'], ['01/13/2025'], ['02/30/2025']])(
      'should reject the impossible calendar date %s',
      date => {
        const issues = getIssues(parse({ date }))

        expect(issues).toHaveLength(1)
        expect(issues[0]).toMatchObject({
          message: 'Enter a correct date',
          path: ['start', 'date'],
        })
      },
    )

    it.each([['01/01/1999'], ['31/12/3000']])('should reject the out-of-range year in %s', date => {
      const issues = getIssues(parse({ date }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct date' })
    })

    it('should reject invalid values on both dates', () => {
      const issues = getIssues(
        parse({ date: '00/01/2025', hour: '1', minute: '1' }, { date: '02/30/2025', hour: '1', minute: '1' }),
      )

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ code: 'custom', message: 'Enter a correct date' })
      expect(issues[1]).toMatchObject({ code: 'custom', message: 'Enter a correct date' })
    })
  })

  describe('hour and minute fields', () => {
    it('should highlight both inputs but only show text once when hour and minute are empty', () => {
      const issues = getIssues(parse({ hour: '', minute: '' }, { hour: '', minute: '' }))

      expect(issues).toHaveLength(4)
      expect(issues[0]).toMatchObject({ message: "Enter a 'time from'", path: ['start', 'hour'] })
      expect(issues[1]).toMatchObject({
        message: "Enter a 'time from'",
        path: ['start', 'minute'],
        params: { highlightOnly: true },
      })
      expect(issues[2]).toMatchObject({ message: "Enter a 'time to'", path: ['end', 'hour'] })
      expect(issues[3]).toMatchObject({
        message: "Enter a 'time to'",
        path: ['end', 'minute'],
        params: { highlightOnly: true },
      })
      expect(issues[0]).not.toHaveProperty('params')
      expect(issues[2]).not.toHaveProperty('params')
    })

    it('should treat whitespace-only hour and minute as empty', () => {
      const issues = getIssues(parse({ hour: ' ', minute: ' ' }))

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ message: "Enter a 'time from'", path: ['start', 'hour'] })
    })

    it('should require an hour when only the hour is empty', () => {
      const issues = getIssues(parse({ hour: '' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: "Enter an hour for 'time from'", path: ['start', 'hour'] })
      expect(issues[0]).not.toHaveProperty('params')
    })

    it('should require minutes when only the minute is empty', () => {
      const issues = getIssues(parse({}, { minute: '' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: "Enter the minutes for 'time to'", path: ['end', 'minute'] })
      expect(issues[0]).not.toHaveProperty('params')
    })

    it.each([
      ['out-of-range hour', '25'],
      ['negative hour', '-1'],
      ['fractional hour', '1.5'],
      ['non-numeric hour', 'ab'],
    ])('should only reject the hour field for an %s', (_description, hour) => {
      const issues = getIssues(parse({ hour, minute: '1' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct hour', path: ['start', 'hour'] })
      expect(issues).not.toContainEqual(expect.objectContaining({ path: ['start', 'date'] }))
    })

    it.each([
      ['out-of-range minute', '60'],
      ['fractional minute', '1.5'],
      ['non-numeric minute', 'ab'],
    ])('should only reject the minute field for an %s', (_description, minute) => {
      const issues = getIssues(parse({}, { hour: '1', minute }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter the correct minutes', path: ['end', 'minute'] })
    })

    it('should report both fields separately when hour and minute are invalid', () => {
      const issues = getIssues(parse({ hour: '25', minute: '60' }))

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct hour', path: ['start', 'hour'] })
      expect(issues[1]).toMatchObject({ message: 'Enter the correct minutes', path: ['start', 'minute'] })
      expect(issues[0]).not.toHaveProperty('params')
      expect(issues[1]).not.toHaveProperty('params')
    })
  })

  describe('dates in the future', () => {
    it('should reject a date to in the future', () => {
      const issues = getIssues(parse({}, { date: TOMORROW }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        message: "Enter a 'date to' that is today or in the past",
        path: ['end', 'date'],
      })
    })

    it('should reject a date from in the future', () => {
      const issues = getIssues(parse({ date: TOMORROW }, { date: DAY_AFTER_TOMORROW }))

      expect(issues).toContainEqual(
        expect.objectContaining({
          message: "Enter a 'date from' that is today or in the past",
          path: ['start', 'date'],
        }),
      )
    })

    it('should not run the time-in-the-past check when the date is already in the future', () => {
      const issues = getIssues(parse({}, { date: TOMORROW, hour: '23', minute: '59' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ path: ['end', 'date'] })
    })
  })

  describe('times in the future', () => {
    it('should highlight hour and minute but show text once for a time to later today', () => {
      const issues = getIssues(
        parse({ date: TODAY, hour: '10', minute: '00' }, { date: TODAY, hour: '23', minute: '59' }),
      )

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({
        message: "Enter a 'time to' that is in the past",
        path: ['end', 'hour'],
      })
      expect(issues[1]).toMatchObject({
        message: "Enter a 'time to' that is in the past",
        path: ['end', 'minute'],
        params: { highlightOnly: true },
      })
      expect(issues[0]).not.toHaveProperty('params')
    })

    it('should highlight hour and minute but show text once for a time from later today', () => {
      const issues = getIssues(
        parse({ date: TODAY, hour: '23', minute: '58' }, { date: TODAY, hour: '23', minute: '59' }),
      )

      expect(issues).toContainEqual(
        expect.objectContaining({
          message: "Enter a 'time from' that is in the past",
          path: ['start', 'hour'],
        }),
      )
      expect(issues).toContainEqual(
        expect.objectContaining({
          message: "Enter a 'time from' that is in the past",
          path: ['start', 'minute'],
          params: { highlightOnly: true },
        }),
      )
    })

    it('should accept a time one minute before now', () => {
      // Now is 13:00 London time
      const result = parse({ date: TODAY, hour: '12', minute: '58' }, { date: TODAY, hour: '12', minute: '59' })
      expect(result.success).toBe(true)
    })

    it('should reject a time one minute after now', () => {
      const issues = getIssues(
        parse({ date: TODAY, hour: '12', minute: '58' }, { date: TODAY, hour: '13', minute: '01' }),
      )

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ message: "Enter a 'time to' that is in the past", path: ['end', 'hour'] })
    })

    it('should skip the future-time check when the time is invalid', () => {
      const issues = getIssues(parse({}, { date: TODAY, hour: '25', minute: '00' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct hour', path: ['end', 'hour'] })
    })

    it('should skip the future-time check when the date is invalid', () => {
      const issues = getIssues(parse({}, { date: '31/02/2026', hour: '23', minute: '59' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct date', path: ['end', 'date'] })
    })
  })

  describe('ordering', () => {
    it('should highlight hour and minute but show text once when time to is before time from on the same date', () => {
      const issues = getIssues(
        parse({ date: '01/01/2025', hour: '10', minute: '00' }, { date: '01/01/2025', hour: '9', minute: '00' }),
      )

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: "'Time to' must be after 'time from'",
        path: ['end', 'hour'],
      })
      expect(issues[1]).toMatchObject({
        message: "'Time to' must be after 'time from'",
        path: ['end', 'minute'],
        params: { highlightOnly: true },
      })
      expect(issues[0]).not.toHaveProperty('params')
    })

    it('should reject when end date is before start date', () => {
      const issues = getIssues(
        parse({ date: '02/01/2025', hour: '1', minute: '1' }, { date: '01/01/2025', hour: '1', minute: '1' }),
      )

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: "'Date to' must be after 'date from'",
        path: ['end', 'date'],
      })
    })

    it('should reject when start and end date and time are exactly the same', () => {
      const issues = getIssues(
        parse({ date: '01/01/2025', hour: '1', minute: '1' }, { date: '01/01/2025', hour: '1', minute: '1' }),
      )

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        code: 'custom',
        message: "'Date from' and 'time from' must be earlier than 'date to' and 'time to'",
        path: ['start', 'date'],
      })
    })

    it('should skip ordering checks when a date is invalid', () => {
      const issues = getIssues(parse({ date: '31/02/2025' }, { date: '01/01/2025' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct date', path: ['start', 'date'] })
    })

    it('should skip ordering checks when a time is invalid', () => {
      const issues = getIssues(parse({ date: '02/01/2025', hour: '25' }, { date: '01/01/2025' }))

      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct hour', path: ['start', 'hour'] })
    })
  })
  describe('Hour and minute error handling', () => {
    it('should report an empty hour and an invalid minute together', () => {
      const issues = getIssues(parse({ hour: '', minute: '60' }))

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ message: "Enter an hour for 'time from'", path: ['start', 'hour'] })
      expect(issues[1]).toMatchObject({ message: 'Enter the correct minutes', path: ['start', 'minute'] })
    })

    it('should report an invalid hour and an empty minute together', () => {
      const issues = getIssues(parse({}, { hour: '25', minute: '' }))

      expect(issues).toHaveLength(2)
      expect(issues[0]).toMatchObject({ message: 'Enter a correct hour', path: ['end', 'hour'] })
      expect(issues[1]).toMatchObject({ message: "Enter the minutes for 'time to'", path: ['end', 'minute'] })
    })

    it('should report an error on every invalid field across both sides', () => {
      const issues = getIssues(
        parse({ date: '31/02/2025', hour: '25', minute: '' }, { date: 'abc', hour: '', minute: '60' }),
      )

      expect(issues.map(i => i.path.join('-')).sort()).toEqual(
        ['start-date', 'start-hour', 'start-minute', 'end-date', 'end-hour', 'end-minute'].sort(),
      )
    })
  })
})

describe('viewLocationsQueryParametersSchema', () => {
  it('should default fromDate and toDate to empty strings', () => {
    expect(viewLocationsQueryParametersSchema.parse({})).toEqual({ fromDate: '', toDate: '' })
  })

  it('should keep supplied values', () => {
    const input = { fromDate: '2025-01-01T10:00:00.000Z', toDate: '2025-01-02T10:00:00.000Z' }
    expect(viewLocationsQueryParametersSchema.parse(input)).toEqual(input)
  })
})
