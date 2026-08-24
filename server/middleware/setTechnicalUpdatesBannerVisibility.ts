import { Request, Response, NextFunction, RequestHandler } from 'express'

export default function setTechnicalUpdatesBannerVisibility(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.showTechnicalUpdatesBanner = /\/locations$/.test(req.path)
    next()
  }
}
