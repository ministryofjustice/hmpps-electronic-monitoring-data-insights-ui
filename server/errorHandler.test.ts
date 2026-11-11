import type { Express, Request, Response } from 'express'
import request from 'supertest'
import createErrorHandler from './errorHandler'
import { appWithAllRoutes } from './routes/testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render the error message in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('API errors with a userMessage', () => {
  const userMessage =
    'Person exists in EMDI but is associated with region Probation North West which is not trial region.'

  it.each([403, 404])('should render the userMessage for a %s', status => {
    const handler = createErrorHandler(true)
    const error = Object.assign(new Error('boom'), { status, data: { code: 'UNRECOGNISED_CODE', userMessage } })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    handler(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.message).toEqual(userMessage)
    expect(res.status).toHaveBeenCalledWith(status)
    expect(res.render).toHaveBeenCalledWith('pages/error')
  })

  it.each([
    ['PERSON_NOT_FOUND', {}, 'This person could not be found in EMDI'],
    [
      'PERSON_NO_POSITION_DATA',
      { isMonitored: false },
      'No location data can currently be displayed by the tool for this case.',
    ],
    [
      'PERSON_NO_POSITION_DATA',
      { isMonitored: true },
      'No location data can currently be displayed by the tool for this case.',
    ],
    [
      'PERSON_OUTSIDE_ORDER_PERIOD',
      {},
      'This case is no longer available to view via this tool as the monitoring period is recorded as ended within Delius.',
    ],
    [
      'PERSON_NO_LOCATION_MONITORING',
      { enforceableConditions: 'Curfew, Exclusion' },
      'This case is available to view, however EMS does not have a location monitoring condition recorded as part of their GPS tag requirement.',
    ],
    [
      'PERSON_NOT_TRIAL_REGION',
      { region: 'Probation North West' },
      'This case is available to view, however EMS have recorded this person as being in Probation North West which is not currently part of the EMDI pilot.',
    ],
  ])('should use the localized content for %s', (code, metadata, title) => {
    const error = Object.assign(new Error('boom'), { status: 404, data: { code, metadata, userMessage } })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.message).toBe(title)
    expect(res.locals.errorContent).toBeDefined()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.render).toHaveBeenCalledWith('pages/error')
  })

  it('should include metadata-specific content for position data errors', () => {
    const error = Object.assign(new Error('boom'), {
      status: 404,
      data: { code: 'PERSON_NO_POSITION_DATA', metadata: { isMonitored: true }, userMessage },
    })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.errorContent.paragraphs).toContain(
      'If you require this information urgently, please escalate your request through EMS.',
    )
  })

  it('should separate the person-not-found intro, bullets, and closing paragraphs', () => {
    const error = Object.assign(new Error('boom'), {
      status: 404,
      data: { code: 'PERSON_NOT_FOUND', metadata: {}, userMessage },
    })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.errorContent.introParagraphs).toEqual(['This could be because:'])
    expect(res.locals.errorContent.bullets).toHaveLength(2)
    expect(res.locals.errorContent.paragraphs).toHaveLength(2)
    expect(res.locals.errorContent.paragraphs[0]).toMatch(/^This can sometimes be corrected/)
  })

  it('should fall back to the API userMessage when required metadata is missing', () => {
    const error = Object.assign(new Error('boom'), {
      status: 404,
      data: { code: 'PERSON_NOT_TRIAL_REGION', userMessage },
    })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.message).toEqual(userMessage)
    expect(res.locals.errorContent).toBeUndefined()
  })

  it('should read the status from responseStatus as set by hmpps-rest-client', () => {
    const error = Object.assign(new Error('Not Found'), { responseStatus: 404, data: { userMessage } })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    createErrorHandler(true)(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.locals.message).toEqual(userMessage)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should render restricted offender error with specific heading and message in paragraph', () => {
    const userMessage =
      'Forbidden: This is a restricted offender record. Please contact Team: Nuneaton & Rugby Team 2, xxx'
    const handler = createErrorHandler(true)
    const error = Object.assign(new Error('boom'), { status: 403, data: { userMessage } })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    handler(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.title).toEqual('You cannot access this page')
    expect(res.locals.message).toEqual(userMessage)
    expect(res.locals.errorContent).toBeUndefined()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.render).toHaveBeenCalledWith('pages/error')
  })

  it('should still sign out on a 403 without a userMessage', () => {
    const res = { locals: {}, redirect: jest.fn() } as unknown as Response
    handler403(res)
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })
})

function handler403(res: Response) {
  createErrorHandler(true)(
    Object.assign(new Error('x'), { status: 403 }) as never,
    { originalUrl: '/x' } as Request,
    res,
    jest.fn(),
  )
}
