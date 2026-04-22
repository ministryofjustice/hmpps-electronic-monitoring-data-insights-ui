import { HmppsUser } from '../../interfaces/hmppsUser'
import { ValidationResult } from '../../models/ValidationResult'

export declare module 'express-session' {
  interface SelectedPersonContext {
    personId: string
    consumerId: string
    fullName: string
    dateOfBirth: string
  }

  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    formData: unknown
    validationErrors: ValidationResult
    queryId: string
    peopleSelection: Record<string, SelectedPersonContext>
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: HmppsUser
    }
  }
}
