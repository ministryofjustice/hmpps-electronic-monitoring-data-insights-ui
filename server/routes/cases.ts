import { type RequestHandler, Router } from 'express'
import type { Services } from '../services'
import CasesController from '../controllers/cases/casesController'

export default function casesRoutes(
  { auditService }: Services,
  get: (path: string, handler: RequestHandler) => Router,
  post: (path: string, handler: RequestHandler) => Router,
): void {
  const casesController = new CasesController(auditService)

  get('/cases', async (req, res) => {
    await casesController.overview(req, res)
  })

  get('/cases/curfew', async (req, res) => {
    await casesController.curfew(req, res)
  })

  get('/cases/notes', async (req, res) => {
    await casesController.notes(req, res)
  })
}
