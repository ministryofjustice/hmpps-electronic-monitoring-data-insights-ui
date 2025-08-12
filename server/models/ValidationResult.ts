import { z } from 'zod/v4'

export const ErrorMessageModel = z.object({
  field: z.string(),
  message: z.string(),
})

export const ValidationResultModel = z.array(ErrorMessageModel)

export type ValidationError = z.infer<typeof ErrorMessageModel>

export type ValidationResult = z.infer<typeof ValidationResultModel>

export const isValidationResult = (result: unknown): result is ValidationResult => {
  return (
    Array.isArray(result) &&
    result.every(r => (r as ValidationError).field !== undefined && (r as ValidationError).message !== undefined)
  )
}
