import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import mockPopDetails from '../mocks/popDetails'

export default class CasesController {
  constructor(private readonly auditService: AuditService) {}

  async overview(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_OVERVIEW_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/casesOverview', {
      activeNav: 'cases',
      activeTab: 'overview',
      popData: mockPopDetails,
      alert: true,
    })
  }

  async curfew(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_CURFEW_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/casesCurfew', {
      activeNav: 'cases',
      activeTab: 'curfew',
      popData: mockPopDetails,
      alert: true,
    })
  }

  async notes(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_NOTES_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/casesNotes', {
      activeNav: 'cases',
      activeTab: 'notes',
    })
  }
}
