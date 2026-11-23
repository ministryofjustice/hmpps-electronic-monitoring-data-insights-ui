import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import mapHelplocale from './map-help.locale.json'
import whatsNewLocale from './whats-new.locale.json'

export default class StaticController {
  constructor(private readonly auditService: AuditService) {}

  private getReturnUrl(req: Request): string {
    const returnUrl = req.query?.returnUrl
    return typeof returnUrl === 'string' && returnUrl ? returnUrl : '/'
  }

  async mapHelp(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.MAP_HELP_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/mapHelp', {
      locale: mapHelplocale,
      returnUrl: this.getReturnUrl(req),
    })
  }

  async whatsNew(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.WHATS_NEW_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/whatsNew', {
      locale: whatsNewLocale,
      returnUrl: this.getReturnUrl(req),
    })
  }
}
