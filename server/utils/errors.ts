import { ZodError } from 'zod/v4'
import { ValidationError, ValidationResult } from '../models/ValidationResult'
import { GovUkErrorMessage } from '../types/govUk/errorMessage'

const createGovUkErrorMessage = (error: ValidationError): GovUkErrorMessage => ({
  text: error.message,
})

const convertZodErrorToValidationError = (error: ZodError): ValidationResult => {
  return error.issues.reduce((acc, issue) => {
    acc.push({
      field: issue.path.join('_').toString(),
      message: issue.message,
    })
    return acc
  }, [] as ValidationResult)
}

const flattenErrorsToMap = (errors: ValidationResult) => {
  return errors.reduce(
    (acc, error) => {
      acc[error.field] = createGovUkErrorMessage(error)
      return acc
    },
    {} as Record<string, GovUkErrorMessage>,
  )
}

export { createGovUkErrorMessage, convertZodErrorToValidationError, flattenErrorsToMap }
