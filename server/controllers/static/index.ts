import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import mapHelplocale from './map-help.locale.json'

export default class StaticController {
  constructor(private readonly auditService: AuditService) {}

  async mapHelp(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.MAP_HELP_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/mapHelp', {
      locale: mapHelplocale,
      returnUrl: req.query?.returnUrl ? decodeURIComponent(req.query.returnUrl as string) : '/',
    })
  }
}
