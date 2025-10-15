import { Request, Response } from 'express'
import CasesController from './casesController'
import AuditService, { Page } from '../../services/auditService'
import { user } from '../../routes/testutils/appSetup'
import mockPopDetails from '../mocks/popDetails'
import * as dummyDataUtils from '../../utils/dummyDataUtils'
import { FormattedPerson } from '../../interfaces/dummyDataPerson'

jest.mock('../../services/auditService')

describe('CasesController', () => {
  let auditService: jest.Mocked<AuditService>
  let controller: CasesController
  let req: Partial<Request>
  let res: Partial<Response>

  jest.spyOn(dummyDataUtils, 'getNameFromPersonObject').mockReturnValue('John Smith')
  jest.spyOn(dummyDataUtils, 'getFormattedPerson').mockReturnValue({
    delius_id: 'X123456',
    date_of_birth: { year: 1990, month: 1, day: 1 },
  } as unknown as FormattedPerson)

  beforeEach(() => {
    auditService = new AuditService(null) as jest.Mocked<AuditService>

    req = { id: 'test-correlation-id', params: { id: '1', highlight: null } }
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
      expect(res.render).toHaveBeenCalledWith('pages/casesOverview', {
        activeNav: 'cases',
        activeTab: 'overview',
        popData: {
          crn: 'X123456',
          dateOfBirth: 'Monday, 1 January 1990',
          tier: 'B3',
        },
        highlight: null,
        id: undefined,
        alert: true,
        fullName: 'John Smith',
        person: { delius_id: 'X123456', date_of_birth: { year: 1990, month: 1, day: 1 } },
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
      expect(res.render).toHaveBeenCalledWith('pages/casesCurfew', {
        activeNav: 'cases',
        activeTab: 'curfew',
        popData: mockPopDetails,
        alert: true,
        id: '1',
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
      expect(res.render).toHaveBeenCalledWith('pages/casesNotes', {
        activeNav: 'cases',
        activeTab: 'notes',
        id: '1',
      })
    })
  })
})
