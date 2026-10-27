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
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
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
    const error = Object.assign(new Error('boom'), { status, data: { code: 'PERSON_NOT_TRIAL_REGION', userMessage } })
    const res = { locals: {}, redirect: jest.fn(), status: jest.fn(), render: jest.fn() } as unknown as Response

    handler(error as never, { originalUrl: '/x' } as Request, res, jest.fn())

    expect(res.redirect).not.toHaveBeenCalled()
    expect(res.locals.message).toEqual(userMessage)
    expect(res.status).toHaveBeenCalledWith(status)
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
