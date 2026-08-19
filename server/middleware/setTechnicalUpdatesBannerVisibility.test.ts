import { Request, Response, NextFunction } from 'express'
import setTechnicalUpdatesBannerVisibility from './setTechnicalUpdatesBannerVisibility'

describe('setTechnicalUpdatesBannerVisibility', () => {
  const makeReq = (path: string) => ({ path }) as Request
  const makeRes = () => ({ locals: {} }) as Response
  const next = jest.fn() as NextFunction

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set showTechnicalUpdatesBanner to true for /locations path', () => {
    const req = makeReq('/locations')
    const res = makeRes()
    setTechnicalUpdatesBannerVisibility()(req, res, next)

    expect(res.locals.showTechnicalUpdatesBanner).toBe(true)
    expect(next).toHaveBeenCalled()
  })

  it('should set showTechnicalUpdatesBanner to false for other paths', () => {
    const req = makeReq('/locations/123')
    const res = makeRes()
    setTechnicalUpdatesBannerVisibility()(req, res, next)

    expect(res.locals.showTechnicalUpdatesBanner).toBe(false)
    expect(next).toHaveBeenCalled()
  })
})
