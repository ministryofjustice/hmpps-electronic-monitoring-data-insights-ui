import { type RequestHandler, Router } from 'express'
import type { Services } from '../services'
import CasesController from '../controllers/cases/casesController'

export default function casesRoutes(
  { auditService, trailService, dateSearchValidationService }: Services,
  get: (path: string, handler: RequestHandler) => Router,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  post: (path: string, handler: RequestHandler) => Router,
): void {
  const casesController = new CasesController(auditService, trailService, dateSearchValidationService)

  get('/cases/:person_id/overview/:highlight?', async (req, res) => {
    await casesController.overview(req, res)
  })

  get('/cases/:person_id/curfew', async (req, res) => {
    await casesController.curfew(req, res)
  })

  get('/cases/:person_id/location-activity', async (req, res) => {
    await casesController.location(req, res)
  })

  get('/cases/:person_id/notes', async (req, res) => {
    await casesController.notes(req, res)
  })
}
