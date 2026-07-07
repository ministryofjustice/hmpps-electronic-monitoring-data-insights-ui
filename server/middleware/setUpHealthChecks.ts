import express, { Router } from 'express'

import { monitoringMiddleware, endpointHealthComponent } from '@ministryofjustice/hmpps-monitoring'
import type { EndpointHealthComponentOptions } from '@ministryofjustice/hmpps-monitoring'
import logger from '../../logger'
import config from '../config'

type ApplicationInfo = Parameters<typeof monitoringMiddleware>[0]['applicationInfo']

function isEndpointHealthComponentOptions(options: unknown): options is EndpointHealthComponentOptions {
  return typeof options === 'object' && options !== null && 'url' in options && 'healthPath' in options
}

export default function setUpHealthChecks(applicationInfo: ApplicationInfo): Router {
  const router = express.Router()

  const apiConfig = Object.entries(config.apis).filter((entry): entry is [string, EndpointHealthComponentOptions] =>
    isEndpointHealthComponentOptions(entry[1]),
  )

  const middleware = monitoringMiddleware({
    applicationInfo,
    healthComponents: apiConfig.map(([name, options]) => endpointHealthComponent(logger, name, options)),
  })

  router.get('/health', middleware.health)
  router.get('/info', middleware.info)
  router.get('/ping', middleware.ping)

  return router
}
