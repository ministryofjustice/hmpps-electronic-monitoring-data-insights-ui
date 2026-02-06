import { Dayjs } from 'dayjs'
import { ValidationResult } from '../models/ValidationResult'

const ERROR_INVALID_DATE = 'You must enter a valid value for date'
const ERROR_TO_BEFORE_FROM = 'To date must be after From date'
const MAX_SEARCH_WINDOW = 168 * 60 * 60 * 1000 // 168 hours in milliseconds = 7 days
const ERROR_DATES_EXCEED_MAX_SEARCH_WINDOW = 'The selected date range must be 7 days or less'

class DateSearchValidationService {
  validateDateSearchRequest = (from: Dayjs, to: Dayjs) => {
    const errors: ValidationResult = []

    if (!from.isValid()) {
      errors.push({
        field: 'fromDate',
        message: ERROR_INVALID_DATE,
      })
    }

    if (!to.isValid()) {
      errors.push({
        field: 'toDate',
        message: ERROR_INVALID_DATE,
      })
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      }
    }

    if (to.isSameOrBefore(from)) {
      return {
        success: false,
        errors: [
          {
            field: 'toDate',
            message: ERROR_TO_BEFORE_FROM,
          },
        ],
      }
    }

    if (to.valueOf() - from.valueOf() > MAX_SEARCH_WINDOW) {
      return {
        success: false,
        errors: [
          {
            field: 'fromDate',
            message: ERROR_DATES_EXCEED_MAX_SEARCH_WINDOW,
          },
        ],
      }
    }

    return {
      success: errors.length === 0,
      errors,
    }
  }
}

export default DateSearchValidationService
