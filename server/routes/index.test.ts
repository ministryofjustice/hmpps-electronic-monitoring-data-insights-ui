import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService, { Page } from '../services/auditService'
import EmdiService from '../services/emdiService'

jest.mock('../services/auditService')
jest.mock('../services/emdiService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const emdiService = new EmdiService(null) as jest.Mocked<EmdiService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      emdiService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    auditService.logPageView.mockResolvedValue(null)
    emdiService.getCurrentTime.mockResolvedValue('2025-01-01T12:00:00.000')

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('This site is under construction...')
        expect(res.text).toContain('The time is currently 2025-01-01T12:00:00.000')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.HOME_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
        expect(emdiService.getCurrentTime).toHaveBeenCalled()
      })
  })

  it('service errors are handled', () => {
    auditService.logPageView.mockResolvedValue(null)
    emdiService.getCurrentTime.mockRejectedValue(new Error('Some problem calling external api!'))

    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Some problem calling external api!')
      })
  })
})

describe('Routes', () => {
  it('GET /cases', () => {
    return request(app)
      .get('/cases')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Cases')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.CASES_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })

  it('GET /search', () => {
    return request(app)
      .get('/search')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(res.text).toContain('Search')
        expect(auditService.logPageView).toHaveBeenCalledWith(Page.SEARCH_PAGE, {
          who: user.username,
          correlationId: expect.any(String),
        })
      })
  })
})
