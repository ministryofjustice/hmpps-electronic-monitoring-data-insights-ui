import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { Page } from '../services/auditService'
import populateSessionData from '../middleware/populateSessionData'
import SearchController from '../controllers/search/searchController'
import casesRoutes from './cases'

export default function routes(services: Services): Router {
  const router = Router()
  const { auditService } = services
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    await auditService.logPageView(Page.HOME_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/index', { activeNav: '/' })
  })

  casesRoutes(services, get, post)
  const searchController = new SearchController(auditService)
  router.use(populateSessionData)

  get('/search', searchController.view)

  return router
}
