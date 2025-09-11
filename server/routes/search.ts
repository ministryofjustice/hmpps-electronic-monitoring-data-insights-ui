import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import { Page } from '../services/auditService'
import populateSessionData from '../middleware/populateSessionData'

export default function routes({ auditService }: Services): Router {
  const router = Router()
  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get('/search', async (req, res, next) => {
    await auditService.logPageView(Page.SEARCH_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/search', { activeNav: 'search' })
  })

  router.use(populateSessionData)

  return router
}
