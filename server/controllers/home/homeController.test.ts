import { Request, Response } from 'express'
import HomeController from './homeController'
import AuditService, { Page } from '../../services/auditService'
import { user } from '../../routes/testutils/appSetup'
import mockPopDetails from './mocks/popDetails'

jest.mock('../../services/auditService')

describe('HomeController', () => {
  let auditService: jest.Mocked<AuditService>
  let controller: HomeController
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    auditService = new AuditService(null) as jest.Mocked<AuditService>
    req = { id: 'test-correlation-id' }
    res = {
      locals: { user },
      render: jest.fn(),
    }
    controller = new HomeController(auditService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('home', () => {
    it('should log page view and render the home page', async () => {
      await controller.home(req as Request, res as Response)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.HOME_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })
      expect(res.render).toHaveBeenCalledWith('pages/index', {
        activeNav: '/',
        popData: mockPopDetails,
      })
    })
  })
})
