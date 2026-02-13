import { Request, Response } from 'express'
import CasesController from './casesController'
import AuditService, { Page } from '../../services/auditService'
import { user } from '../../routes/testutils/appSetup'
import mockPopDetails from '../mocks/popDetails'
import * as dummyDataUtils from '../../utils/dummyDataUtils'
import { FormattedPerson } from '../../interfaces/dummyDataPerson'
import TrailService from '../../services/trailService'
import DateSearchValidtionService from '../../services/dateSearchValidtionService'
import { ValidationError } from '../../models/ValidationResult'
import {
  buildLocationPageInitialState,
  buildLocationPageWithServiceError,
  buildLocationPageWithValidationErrors,
} from '../../testutils/factories/locationPage.factory'

jest.mock('../../services/auditService')
jest.mock('../../services/trailService')
jest.mock('../../services/dateSearchValidtionService')

describe('CasesController', () => {
  let auditService: jest.Mocked<AuditService>
  let trailService: jest.Mocked<TrailService>
  let dateSearchValidtionService: jest.Mocked<DateSearchValidtionService>
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
    trailService = new TrailService() as jest.Mocked<TrailService>

    dateSearchValidtionService = {
      validateDateSearchRequest: jest.fn().mockReturnValue({ success: true }),
    } as jest.Mocked<DateSearchValidtionService>

    trailService = { filterByDate: jest.fn() } as jest.Mocked<TrailService>

    req = { id: 'test-correlation-id', params: { id: '1', highlight: null } }
    res = {
      locals: { user },
      render: jest.fn(),
    }
    controller = new CasesController(auditService, trailService, dateSearchValidtionService)
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

  describe('locationActivity', () => {
    it('should log page view and render location activity tab', async () => {
      req.query = { crn: 'X172591' }
      await controller.location(req as Request, res as Response)
      expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_LOCATION_PAGE, {
        who: 'user1',
        correlationId: 'test-correlation-id',
      })

      const expected = buildLocationPageInitialState('X172591', {
        popData: mockPopDetails,
      })

      expect(res.render).toHaveBeenCalledWith('pages/casesLocation', expected)
    })

    it('should handle validation errors and render location activity tab with errors', async () => {
      const validationErrors = [{ field: 'fromDate', message: 'Invalid date' }] as ValidationError[]
      dateSearchValidtionService.validateDateSearchRequest.mockReturnValue({ success: false, errors: validationErrors })

      const queryData = {
        crn: 'X172591',
        start: {
          date: '12/01/2026',
          hour: '10',
          minute: '00',
          second: '00',
        },
        end: {
          date: '14/1/2026',
          hour: '11',
          minute: '00',
          second: '00',
        },
      }

      req.query = queryData

      await controller.location(req as Request, res as Response)

      const expected = buildLocationPageWithValidationErrors(validationErrors, queryData.crn, {
        popData: mockPopDetails,
      })

      expect(res.render).toHaveBeenCalledWith('pages/casesLocation', expected)
    })

    it('should show alert when no location data found for valid search', async () => {
      trailService.filterByDate.mockResolvedValue([])

      const queryData = {
        crn: 'X172591',
        start: {
          date: '12/01/2026',
          hour: '10',
          minute: '00',
          second: '00',
        },
        end: {
          date: '14/1/2026',
          hour: '11',
          minute: '00',
          second: '00',
        },
      }

      req.query = queryData

      await controller.location(req as Request, res as Response)

      const expected = buildLocationPageWithValidationErrors([], queryData.crn, {
        popData: mockPopDetails,
        locationAlert: { text: 'No location data found for the selected date range.' },
      })

      expect(res.render).toHaveBeenCalledWith('pages/casesLocation', expected)
    })

    it('should handle when search service has an exception', async () => {
      ;(trailService.filterByDate as jest.Mock).mockRejectedValue(new Error('Search service error'))

      const queryData = {
        crn: 'X172591',
        start: {
          date: '12/01/2026',
          hour: '10',
          minute: '00',
          second: '00',
        },
        end: {
          date: '14/01/2026',
          hour: '11',
          minute: '00',
          second: '00',
        },
      }

      req.query = queryData

      await controller.location(req as Request, res as Response)

      const expected = buildLocationPageWithServiceError(queryData.crn, queryData.start.date, queryData.end.date, {
        popData: mockPopDetails,
      })

      expect(res.render).toHaveBeenCalledWith('pages/casesLocation', expected)
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
