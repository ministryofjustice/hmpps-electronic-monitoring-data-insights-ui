import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { Page } from '../services/auditService'
import populateSessionData from '../middleware/populateSessionData'
import SearchController from '../controllers/search/searchController'
import CasesController from '../controllers/cases/casesController'

export default function routes({ auditService, emdiService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/', async (req, res, next) => {
    await auditService.logPageView(Page.HOME_PAGE, { who: res.locals.user.username, correlationId: req.id })
    const currentTime = await emdiService.getCurrentTime()
    res.render('pages/index', { activeNav: '/', currentTime })
  })

  const casesController = new CasesController(auditService)
  const searchController = new SearchController(auditService)
  router.use(populateSessionData)

  get('/cases', casesController.view)
  get('/search', searchController.view)

  return router
}
