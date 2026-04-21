import { Request, Response } from 'express'
import StaticController from './index'
import AuditService, { Page } from '../../services/auditService'
import { user } from '../../routes/testutils/appSetup'
import mapHelpLocale from './map-help.locale.json'

jest.mock('../../services/auditService')

describe('StaticController', () => {
  let auditService: jest.Mocked<AuditService>
  let controller: StaticController
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    auditService = new AuditService(null) as jest.Mocked<AuditService>
    req = { id: 'test-correlation-id' }
    res = {
      locals: { user },
      render: jest.fn(),
    }
    controller = new StaticController(auditService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('mapHelp', () => {
    it('logs page view and renders the map help page with locale content', async () => {
      await controller.mapHelp(req as Request, res as Response)

      expect(auditService.logPageView).toHaveBeenCalledWith(Page.MAP_HELP_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })
      expect(res.render).toHaveBeenCalledWith('pages/mapHelp', {
        locale: mapHelpLocale,
      })
    })
  })
})
