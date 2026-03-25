import { Request, Response } from 'express'
import PeopleService from '../../services/peopleService'

export default class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  async getPersonByDeliusId(req: Request, res: Response): Promise<void> {
    const { delius_id: deliusId } = req.params
    const { token } = res.locals.user
    const result = await this.peopleService.searchPeople(token, deliusId)
    const person = result.people[0] ?? null

    res.render('pages/person', {
      activeNav: 'people',
      fullName: person?.name ?? 'Person not found',
      popData: person
        ? {
            crn: person.deliusId,
            dateOfBirth: person.dateOfBirth,
            tier: 'B3',
          }
        : null,
      showComplianceBadge: false,
      person,
    })
  }
}
