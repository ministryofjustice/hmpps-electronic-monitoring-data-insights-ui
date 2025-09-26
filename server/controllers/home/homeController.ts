import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import mockPopDetails from './mocks/popDetails'

export default class HomeController {
  constructor(private readonly auditService: AuditService) {}

  async home(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.HOME_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/index', {
      activeNav: '/',
      popData: mockPopDetails,
      alert: true,
    })
  }
}
