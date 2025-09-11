import { RequestHandler } from 'express'
import AuditService, { Page } from '../../services/auditService'

export default class SearchController {
  constructor(private readonly auditService: AuditService) {}

  view: RequestHandler = async (req, res) => {
    await this.auditService.logPageView(Page.SEARCH_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/search', {
      activeNav: 'search',
    })
  }
}
