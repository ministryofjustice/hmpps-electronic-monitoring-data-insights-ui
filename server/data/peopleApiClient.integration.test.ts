import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PeopleApiClient from './peopleApiClient'

describe('PeopleApiClient integration', () => {
  const authenticationClient = {} as AuthenticationClient
  const token = 'user-token'
  const deliusId = 'X31092'
  const personId = '41591'

  let peopleApiClient: PeopleApiClient

  beforeEach(() => {
    peopleApiClient = new PeopleApiClient(authenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('searches people by deliusId against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get('/people')
      .query({ deliusId })
      .reply(200, {
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
      })

    const result = await peopleApiClient.searchPeople(token, deliusId)

    expect(result).toEqual({
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
    })
    expect(nock.isDone()).toBe(true)
  })

  it('gets a single person by personId against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get(`/people/${personId}`)
      .reply(200, {
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
      })

    const result = await peopleApiClient.getPerson(token, personId)

    expect(result).toEqual({
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
    })
    expect(nock.isDone()).toBe(true)
  })
})
