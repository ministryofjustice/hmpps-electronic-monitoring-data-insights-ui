import { Request, Response } from 'express'
import type session from 'express-session'
import type { Person } from '../../services/peopleService'
import type PeopleService from '../../services/peopleService'
import { user } from '../../routes/testutils/appSetup'
import PeopleController from './peopleController'

describe('PeopleController', () => {
  let peopleService: jest.Mocked<PeopleService>
  let controller: PeopleController
  let req: Partial<Request>
  let res: Partial<Response>

  const firstPerson: Person = {
    id: '41591',
    consumerId: '9b74b1071beb2210743d8551f54bcbcc',
    name: 'DEVWR0004718',
    nomisId: 'Q0788IA',
    pncId: 'MU50/038758B',
    deliusId: 'X31092',
    horId: 'C5011307',
    ceprId: null,
    prisonId: 'J05007',
    dateOfBirth: '2020-01-01',
    address: {
      postcode: 'BL2 1EW',
      city: 'Bolton',
      street: '2 Dunlin Close',
    },
  }

  beforeEach(() => {
    peopleService = {
      searchPeople: jest.fn(),
    } as unknown as jest.Mocked<PeopleService>

    req = {
      params: { delius_id: 'X31092' },
      query: {},
      session: {} as Request['session'],
    }

    res = {
      locals: { user },
      render: jest.fn(),
      redirect: jest.fn(),
    }

    controller = new PeopleController(peopleService)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the first person for the supplied delius id', async () => {
    peopleService.searchPeople.mockResolvedValue({
      people: [firstPerson],
      nextToken: null,
    })

    await controller.getPersonByDeliusId(req as Request, res as Response)

    expect(peopleService.searchPeople).toHaveBeenCalledWith(user.token, 'X31092')
    expect(req.session).toEqual({
      peopleSelection: {
        X31092: {
          personId: '41591',
          consumerId: '9b74b1071beb2210743d8551f54bcbcc',
          fullName: 'DEVWR0004718',
          dateOfBirth: '2020-01-01',
        },
      },
    })
    expect(res.render).toHaveBeenCalledWith('pages/person', {
      activeNav: 'people',
      fullName: firstPerson.name,
      popData: {
        crn: firstPerson.deliusId,
        dateOfBirth: firstPerson.dateOfBirth,
        tier: 'B3',
      },
      showComplianceBadge: false,
      person: firstPerson,
    })
  })

  it('redirects onward after hydrating session when redirectTo is provided', async () => {
    peopleService.searchPeople.mockResolvedValue({
      people: [firstPerson],
      nextToken: null,
    })
    req.query = { redirectTo: '/people/X31092/location' }

    await controller.getPersonByDeliusId(req as Request, res as Response)

    expect(res.redirect).toHaveBeenCalledWith('/people/X31092/location')
    expect(res.render).not.toHaveBeenCalled()
  })

  it('renders the location page when state exists in session for the delius id', async () => {
    req.session = {
      peopleSelection: {
        X31092: {
          personId: '41591',
          consumerId: '9b74b1071beb2210743d8551f54bcbcc',
          fullName: 'DEVWR0004718',
          dateOfBirth: '2020-01-01',
        },
      },
    } as unknown as session.Session & Partial<session.SessionData>

    await controller.location(req as Request, res as Response)

    expect(res.render).toHaveBeenCalledWith('pages/personLocation', {
      activeNav: 'people',
      fullName: 'DEVWR0004718',
      popData: {
        crn: 'X31092',
        dateOfBirth: '2020-01-01',
        tier: 'B3',
      },
      showComplianceBadge: false,
      personContext: {
        personId: '41591',
        consumerId: '9b74b1071beb2210743d8551f54bcbcc',
        fullName: 'DEVWR0004718',
        dateOfBirth: '2020-01-01',
      },
    })
  })

  it('redirects back through the person page when location state is missing', async () => {
    await controller.location(req as Request, res as Response)

    expect(res.redirect).toHaveBeenCalledWith('/people/X31092?redirectTo=%2Fpeople%2FX31092%2Flocation')
    expect(res.render).not.toHaveBeenCalled()
  })
})
