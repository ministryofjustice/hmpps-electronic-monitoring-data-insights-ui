import { RequestHandler } from 'express'
import AuditService, { Page } from '../../services/auditService'

export default class CasesController {
  constructor(private readonly auditService: AuditService) {}

  view: RequestHandler = async (req, res) => {
    await this.auditService.logPageView(Page.CASES_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/cases', {
      activeNav: 'cases',
    })
  }
}
