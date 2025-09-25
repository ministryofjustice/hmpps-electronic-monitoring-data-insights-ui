import { type RequestHandler, Router } from 'express'
import type { Services } from '../services'
import HomeController from '../controllers/home/homeController'

export default function homeRoutes(
  { auditService }: Services,
  get: (path: string, handler: RequestHandler) => Router,
): void {
  const homeController = new HomeController(auditService)
  get('/', async (req, res, next) => {
    await homeController.home(req, res)
  })
}
