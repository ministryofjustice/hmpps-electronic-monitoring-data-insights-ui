import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

const getUserMessage = (error: HTTPError & { data?: unknown }): string | undefined => {
  if (error.status !== 403 && error.status !== 404) return undefined
  const { userMessage } = (error.data ?? {}) as { userMessage?: unknown }
  return typeof userMessage === 'string' && userMessage.trim() ? userMessage : undefined
}

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const userMessage = getUserMessage(error)

    if (!userMessage && (error.status === 401 || error.status === 403)) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.locals.message =
      userMessage ?? (production ? 'Something went wrong. The error has been logged. Please try again' : error.message)
    res.locals.status = error.status
    res.locals.stack = production ? null : error.stack

    res.status(error.status || 500)

    return res.render('pages/error')
  }
}
