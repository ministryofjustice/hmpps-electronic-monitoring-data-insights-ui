import { Request, Response } from 'express'
import CasesController from './casesController'
import AuditService, { Page } from '../../services/auditService'
import { user } from '../../routes/testutils/appSetup'

jest.mock('../../services/auditService')

describe('CasesController', () => {
  let auditService: jest.Mocked<AuditService>
  let controller: CasesController
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    auditService = new AuditService(null) as jest.Mocked<AuditService>
    req = { id: 'test-correlation-id' }
    res = {
      locals: { user },
      render: jest.fn(),
    }
    controller = new CasesController(auditService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('overview', () => {
    it('should log page view and render overview tab', async () => {
      await controller.overview(req as Request, res as Response)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_OVERVIEW_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })
      expect(res.render).toHaveBeenCalledWith('pages/cases', {
        activeNav: 'cases',
        activeTab: 'overview',
      })
    })
  })

  describe('curfew', () => {
    it('should log page view and render curfew tab', async () => {
      await controller.curfew(req as Request, res as Response)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_CURFEW_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })
      expect(res.render).toHaveBeenCalledWith('pages/cases', {
        activeNav: 'cases',
        activeTab: 'curfew',
      })
    })
  })

  describe('notes', () => {
    it('should log page view and render notes tab', async () => {
      await controller.notes(req as Request, res as Response)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_NOTES_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })
      expect(res.render).toHaveBeenCalledWith('pages/cases', {
        activeNav: 'cases',
        activeTab: 'notes',
      })
    })
  })
})
