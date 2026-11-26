import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import homeRoutes from './home'
import peopleRoutes from './people'
import staticRoutes from './static'

export default function routes(services: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  homeRoutes(services, get)
  staticRoutes(services, get)
  peopleRoutes(services, get)

  return router
}
