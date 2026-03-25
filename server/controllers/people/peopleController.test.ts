import { Request, Response } from 'express'
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
    }

    res = {
      locals: { user },
      render: jest.fn(),
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
    expect(res.render).toHaveBeenCalledWith('pages/person', {
      activeNav: 'people',
      person: firstPerson,
    })
  })
})
