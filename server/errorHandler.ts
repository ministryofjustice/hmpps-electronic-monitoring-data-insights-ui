import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

type ApiError = HTTPError & { data?: unknown; responseStatus?: number }

// hmpps-rest-client errors carry the HTTP status as responseStatus, superagent/express errors as status
const getStatus = (error: ApiError): number | undefined => error.responseStatus ?? error.status

const getUserMessage = (error: ApiError): string | undefined => {
  const status = getStatus(error)
  if (status !== 403 && status !== 404) return undefined
  const { userMessage } = (error.data ?? {}) as { userMessage?: unknown }
  return typeof userMessage === 'string' && userMessage.trim() ? userMessage : undefined
}

export default function createErrorHandler(production: boolean) {
  return (error: ApiError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const status = getStatus(error)
    const userMessage = getUserMessage(error)

    if (!userMessage && (status === 401 || status === 403)) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.locals.message =
      userMessage ?? (production ? 'Something went wrong. The error has been logged. Please try again' : error.message)
    res.locals.status = status
    res.locals.stack = production ? null : error.stack

    res.status(status || 500)

    return res.render('pages/error')
  }
}
