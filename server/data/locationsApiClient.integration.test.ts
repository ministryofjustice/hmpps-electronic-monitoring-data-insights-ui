import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import LocationsApiClient from './locationsApiClient'

describe('LocationsApiClient integration', () => {
  const authenticationClient = {} as AuthenticationClient
  const token = 'user-token'
  const personId = '41591'
  const positionId = '98765'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let locationsApiClient: LocationsApiClient

  beforeEach(() => {
    locationsApiClient = new LocationsApiClient(authenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('gets locations by personId and date range against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get(`/people/${personId}/locations`)
      .query({ from, to, nextToken })
      .reply(200, {
        locations: [
          {
            positionId: 98765,
            deviceId: 12345,
            gpsDate: '2026-03-24T12:00:00Z',
            speed: 0,
            satellite: 8,
            direction: 180,
            precision: 10,
            lbs: 1,
            hdop: 1,
            geometry: 'POINT(-2.429 53.578)',
            latitude: 53.578,
            longitude: -2.429,
          },
        ],
        nextToken: null,
      })

    const result = await locationsApiClient.getLocations(token, personId, from, to, nextToken)

    expect(result).toEqual({
      locations: [
        {
          positionId: 98765,
          deviceId: 12345,
          gpsDate: '2026-03-24T12:00:00Z',
          speed: 0,
          satellite: 8,
          direction: 180,
          precision: 10,
          lbs: 1,
          hdop: 1,
          geometry: 'POINT(-2.429 53.578)',
          latitude: 53.578,
          longitude: -2.429,
        },
      ],
      nextToken: null,
    })
    expect(nock.isDone()).toBe(true)
  })

  it('gets a single location by personId and positionId against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get(`/people/${personId}/locations/${positionId}`)
      .reply(200, [
        {
          positionId: 98765,
          deviceId: 12345,
          gpsDate: '2026-03-24T12:00:00Z',
          speed: 0,
          satellite: 8,
          direction: 180,
          precision: 10,
          lbs: 1,
          hdop: 1,
          geometry: 'POINT(-2.429 53.578)',
          latitude: 53.578,
          longitude: -2.429,
        },
      ])

    const result = await locationsApiClient.getLocation(token, personId, positionId)

    expect(result).toEqual([
      {
        positionId: 98765,
        deviceId: 12345,
        gpsDate: '2026-03-24T12:00:00Z',
        speed: 0,
        satellite: 8,
        direction: 180,
        precision: 10,
        lbs: 1,
        hdop: 1,
        geometry: 'POINT(-2.429 53.578)',
        latitude: 53.578,
        longitude: -2.429,
      },
    ])
    expect(nock.isDone()).toBe(true)
  })
})
