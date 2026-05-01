import PeopleService, { type PeopleSearchResult, type Person } from './peopleService'
import type PeopleApiClient from '../data/peopleApiClient'
import type { ApiPerson } from '../data/peopleApiClient'

describe('PeopleService', () => {
  const username = 'user1'
  const deliusId = 'X31092'
  const personId = '41591'

  let peopleApiClient: jest.Mocked<PeopleApiClient>
  let peopleService: PeopleService

  const apiPerson: ApiPerson = {
    personId: '41591',
    consumerId: '9b74b1071beb2210743d8551f54bcbcc',
    personName: 'DEVWR0004718',
    nomisId: 'Q0788IA',
    pncId: 'MU50/038758B',
    deliusId: 'X31092',
    horId: 'C5011307',
    ceprId: null,
    prisonId: 'J05007',
    dob: '2020-01-01',
    zip: 'BL2 1EW',
    city: 'Bolton',
    street: '2 Dunlin Close',
  }

  const mappedPerson: Person = {
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
    peopleApiClient = {
      searchPeople: jest.fn(),
      getPerson: jest.fn(),
    } as unknown as jest.Mocked<PeopleApiClient>

    peopleService = new PeopleService(peopleApiClient)
  })

  describe('searchPeople', () => {
    it('maps the API people response into domain people', async () => {
      peopleApiClient.searchPeople.mockResolvedValue({
        persons: [apiPerson],
        nextToken: null,
      })

      const result = await peopleService.searchPeople(username, deliusId)

      expect(result).toEqual<PeopleSearchResult>({
        people: [mappedPerson],
        nextToken: null,
      })
      expect(peopleApiClient.searchPeople).toHaveBeenCalledWith(username, deliusId)
    })
  })

  describe('getPerson', () => {
    it('maps the API person response into a domain person', async () => {
      peopleApiClient.getPerson.mockResolvedValue(apiPerson)

      const result = await peopleService.getPerson(username, personId)

      expect(result).toEqual(mappedPerson)
      expect(peopleApiClient.getPerson).toHaveBeenCalledWith(username, personId)
    })
  })
})
