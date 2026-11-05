import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import errorMessages from './errorMessages.locale.json'

type ApiError = HTTPError & { data?: unknown; responseStatus?: number }
type ErrorPayload = {
  code?: unknown
  userMessage?: unknown
  metadata?: {
    isMonitored?: unknown
    region?: unknown
    enforceableConditions?: unknown
  }
}
type ErrorContent = {
  title: string
  paragraphs: string[]
  bullets?: string[]
  contactIntro?: string
  contacts?: { name: string; email: string }[]
}

// hmpps-rest-client errors carry the HTTP status as responseStatus, superagent/express errors as status
const getStatus = (error: ApiError): number | undefined => error.responseStatus ?? error.status

const getPayload = (error: ApiError): ErrorPayload => (error.data ?? {}) as ErrorPayload

const getUserMessage = (error: ApiError): string | undefined => {
  const status = getStatus(error)
  if (status !== 403 && status !== 404) return undefined
  const { userMessage } = getPayload(error)
  return typeof userMessage === 'string' && userMessage.trim() ? userMessage : undefined
}

const interpolate = (content: ErrorContent, replacements: Record<string, string> = {}): ErrorContent => {
  const replace = (text: string) =>
    Object.entries(replacements).reduce((result, [key, value]) => result.split(`$${key}`).join(value), text)

  return {
    ...content,
    title: replace(content.title),
    paragraphs: content.paragraphs.map(replace),
    ...(content.bullets ? { bullets: content.bullets.map(replace) } : {}),
  }
}

const getErrorContent = (error: ApiError): ErrorContent | undefined => {
  if (getStatus(error) !== 404) return undefined

  const { code, metadata = {} } = getPayload(error)

  switch (code) {
    case 'PERSON_NOT_FOUND':
      return errorMessages.PERSON_NOT_FOUND
    case 'PERSON_NO_POSITION_DATA': {
      if (typeof metadata.isMonitored !== 'boolean') return undefined
      const { monitoredParagraphs, notMonitoredParagraphs, ...content } = errorMessages.PERSON_NO_POSITION_DATA
      return {
        ...content,
        paragraphs: [...content.paragraphs, ...(metadata.isMonitored ? monitoredParagraphs : notMonitoredParagraphs)],
      }
    }
    case 'PERSON_OUTSIDE_ORDER_PERIOD':
      return errorMessages.PERSON_OUTSIDE_ORDER_PERIOD
    case 'PERSON_NO_LOCATION_MONITORING':
      if (typeof metadata.enforceableConditions !== 'string') return undefined
      return interpolate(errorMessages.PERSON_NO_LOCATION_MONITORING, {
        enforceableConditions: metadata.enforceableConditions,
      })
    case 'PERSON_NOT_TRIAL_REGION':
      if (typeof metadata.region !== 'string') return undefined
      return interpolate(errorMessages.PERSON_NOT_TRIAL_REGION, { region: metadata.region })
    default:
      return undefined
  }
}

export default function createErrorHandler(production: boolean) {
  return (error: ApiError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const status = getStatus(error)
    const userMessage = getUserMessage(error)
    const errorContent = getErrorContent(error)

    if (!userMessage && (status === 401 || status === 403)) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.locals.errorContent = errorContent
    res.locals.message =
      errorContent?.title ??
      userMessage ??
      (production ? 'Something went wrong. The error has been logged. Please try again' : error.message)
    res.locals.status = status
    res.locals.stack = production ? null : error.stack

    res.status(status || 500)

    return res.render('pages/error')
  }
}
