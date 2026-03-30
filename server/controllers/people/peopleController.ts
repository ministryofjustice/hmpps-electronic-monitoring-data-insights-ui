import { Request, Response } from 'express'
import type session from 'express-session'
import PeopleService from '../../services/peopleService'

type SelectedPersonContext = session.SessionData['peopleSelection'][string]

export default class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  async getPersonByDeliusId(req: Request, res: Response): Promise<void> {
    const { delius_id: deliusId } = req.params
    const { token } = res.locals.user
    const result = await this.peopleService.searchPeople(token, deliusId)
    const person = result.people[0] ?? null

    if (person) {
      this.setSelectedPerson(req, deliusId, {
        personId: person.id ?? '',
        consumerId: person.consumerId ?? '',
        fullName: person.name ?? '',
        dateOfBirth: person.dateOfBirth ?? '',
      })
    }

    const redirectTo = typeof req.query.redirectTo === 'string' ? req.query.redirectTo : null

    if (redirectTo) {
      res.redirect(redirectTo)
      return
    }

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

  async location(req: Request, res: Response): Promise<void> {
    const { delius_id: deliusId } = req.params
    const personContext = this.getSelectedPerson(req, deliusId)

    if (!personContext) {
      const redirectTo = encodeURIComponent(`/people/${deliusId}/location`)
      res.redirect(`/people/${deliusId}?redirectTo=${redirectTo}`)
      return
    }

    res.render('pages/personLocation', {
      activeNav: 'people',
      fullName: personContext.fullName,
      popData: {
        crn: deliusId,
        dateOfBirth: personContext.dateOfBirth,
        tier: 'B3',
      },
      showComplianceBadge: false,
      personContext,
    })
  }

  private getSelectedPerson(req: Request, deliusId: string): SelectedPersonContext | null {
    return req.session.peopleSelection?.[deliusId] ?? null
  }

  private setSelectedPerson(req: Request, deliusId: string, personContext: SelectedPersonContext): void {
    req.session.peopleSelection = {
      ...(req.session.peopleSelection || {}),
      [deliusId]: personContext,
    }
  }
}
