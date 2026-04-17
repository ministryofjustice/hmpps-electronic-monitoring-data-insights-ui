import { type RequestHandler, Router } from 'express'
import type { Services } from '../services'
import StaticController from '../controllers/static/index'

export default function staticRoutes(
  { auditService }: Services,
  get: (path: string, handler: RequestHandler) => Router,
): void {
  const staticController = new StaticController(auditService)
  get('/map-help', async (req, res, next) => {
    await staticController.mapHelp(req, res)
  })
}
