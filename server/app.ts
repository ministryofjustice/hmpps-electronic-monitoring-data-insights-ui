import express from 'express'
import pdsComponents from '@ministryofjustice/hmpps-probation-frontend-components'
import createError from 'http-errors'
import { mojOrdnanceSurveyAuth } from 'hmpps-open-layers-map/ordnance-survey-auth'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { appInsightsMiddleware } from './utils/azureAppInsights'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import routes from './routes'
import type { Services } from './services'
import logger from '../logger'
import config from './config'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', 1)
  app.set('port', process.env.PORT || 3000)

  app.use(appInsightsMiddleware())
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  nunjucksSetup(app)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(setUpCsrf())
  app.use(setUpCurrentUser())
  app.use(
    '*',
    pdsComponents.getPageComponents({
      pdsUrl: config.apis.probationApi.url,
      logger,
    }),
  )
  app.use(
    mojOrdnanceSurveyAuth({
      apiKey: process.env.OS_API_KEY!, // from Ordance Survey
      apiSecret: process.env.OS_API_SECRET!, // from Ordnance Survey
      // Optional: Redis cache + expiry override
      // redisClient, // connected redis client
      // cacheExpiry: 3600, // seconds; default is 7 days in production, 0 in dev
    }),
  )
  app.use(routes(services))

  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
