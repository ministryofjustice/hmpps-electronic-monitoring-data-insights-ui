import { type RequestHandler, Router } from 'express'
import type { Services } from '../services'
import PeopleController from '../controllers/people/peopleController'

export default function peopleRoutes(
  { peopleService }: Services,
  get: (path: string, handler: RequestHandler) => Router,
): void {
  const peopleController = new PeopleController(peopleService)

  get('/people/:delius_id', async (req, res) => {
    await peopleController.getPersonByDeliusId(req, res)
  })
}
