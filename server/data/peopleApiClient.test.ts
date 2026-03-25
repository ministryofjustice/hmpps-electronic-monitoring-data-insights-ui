import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PeopleApiClient, { type ApiPeopleResponse, type ApiPerson } from './peopleApiClient'

describe('PeopleApiClient', () => {
  const authenticationClient = {} as AuthenticationClient
  const token = 'user-token'
  const deliusId = 'X31092'
  const personId = '41591'

  let peopleApiClient: PeopleApiClient

  const searchResponse: ApiPeopleResponse = {
    persons: [
      {
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
      },
    ],
    nextToken: null,
  }

  const personResponse: ApiPerson = searchResponse.persons[0]

  beforeEach(() => {
    peopleApiClient = new PeopleApiClient(authenticationClient)
  })

  describe('searchPeople', () => {
    it('calls the people search endpoint with deliusId using the user token', async () => {
      const getSpy = jest.spyOn(peopleApiClient, 'get').mockResolvedValue(searchResponse)

      const result = await peopleApiClient.searchPeople(token, deliusId)

      expect(result).toEqual(searchResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: '/people',
          query: { deliusId },
        },
        asUser(token),
      )
    })
  })

  describe('getPerson', () => {
    it('calls the person endpoint with personId using the user token', async () => {
      const getSpy = jest.spyOn(peopleApiClient, 'get').mockResolvedValue(personResponse)

      const result = await peopleApiClient.getPerson(token, personId)

      expect(result).toEqual(personResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${personId}`,
        },
        asUser(token),
      )
    })
  })
})
