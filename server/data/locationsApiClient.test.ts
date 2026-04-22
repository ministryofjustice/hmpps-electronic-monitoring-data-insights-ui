import { asUser } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import LocationsApiClient, { type ApiLocation, type ApiLocationsResponse } from './locationsApiClient'

describe('LocationsApiClient', () => {
  const authenticationClient = {} as AuthenticationClient
  const token = 'user-token'
  const personId = '41591'
  const positionId = '98765'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let locationsApiClient: LocationsApiClient

  const locationsResponse: ApiLocationsResponse = {
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
  }

  const locationResponse: ApiLocation[] = locationsResponse.locations

  beforeEach(() => {
    locationsApiClient = new LocationsApiClient(authenticationClient)
  })

  describe('getLocations', () => {
    it('calls the locations endpoint with personId and date range using the user token', async () => {
      const getSpy = jest.spyOn(locationsApiClient, 'get').mockResolvedValue(locationsResponse)

      const result = await locationsApiClient.getLocations(token, personId, from, to)

      expect(result).toEqual(locationsResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${personId}/locations`,
          query: { from, to },
        },
        asUser(token),
      )
    })

    it('includes nextToken when provided', async () => {
      const getSpy = jest.spyOn(locationsApiClient, 'get').mockResolvedValue(locationsResponse)

      await locationsApiClient.getLocations(token, personId, from, to, nextToken)

      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${personId}/locations`,
          query: { from, to, nextToken },
        },
        asUser(token),
      )
    })
  })

  describe('getLocation', () => {
    it('calls the single location endpoint with personId and positionId using the user token', async () => {
      const getSpy = jest.spyOn(locationsApiClient, 'get').mockResolvedValue(locationResponse)

      const result = await locationsApiClient.getLocation(token, personId, positionId)

      expect(result).toEqual(locationResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${personId}/locations/${positionId}`,
        },
        asUser(token),
      )
    })
  })
})
