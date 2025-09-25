import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import populateSessionData from '../middleware/populateSessionData'
import SearchController from '../controllers/search/searchController'
import casesRoutes from './cases'
import homeRoutes from './home'

export default function routes(services: Services): Router {
  const router = Router()
  const { auditService } = services
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  homeRoutes(services, get)
  casesRoutes(services, get, post)
  const searchController = new SearchController(auditService)
  router.use(populateSessionData)

  get('/search', searchController.view)

  return router
}
