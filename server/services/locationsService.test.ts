import LocationsService, { type Location, type LocationsResult } from './locationsService'
import type LocationsApiClient from '../data/locationsApiClient'
import type { ApiLocation } from '../data/locationsApiClient'

describe('LocationsService', () => {
  const username = 'user1'
  const personIdentifier = '41591'
  const positionId = '98765'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let locationsApiClient: jest.Mocked<LocationsApiClient>
  let locationsService: LocationsService

  const apiLocation: ApiLocation = {
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
  }

  const mappedLocation: Location = {
    id: 98765,
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
  }

  beforeEach(() => {
    locationsApiClient = {
      getLocations: jest.fn(),
      getLocation: jest.fn(),
    } as unknown as jest.Mocked<LocationsApiClient>

    locationsService = new LocationsService(locationsApiClient)
  })

  describe('getLocations', () => {
    it('maps the API locations response into domain locations', async () => {
      locationsApiClient.getLocations.mockResolvedValue({
        locations: [apiLocation],
        nextToken,
      })

      const result = await locationsService.getLocations(username, personIdentifier, from, to, nextToken)

      expect(result).toEqual<LocationsResult>({
        locations: [mappedLocation],
        nextToken,
      })
      expect(locationsApiClient.getLocations).toHaveBeenCalledWith(username, personIdentifier, from, to, nextToken)
    })
  })

  describe('getLocation', () => {
    it('maps the API single location response into domain locations', async () => {
      locationsApiClient.getLocation.mockResolvedValue([apiLocation])

      const result = await locationsService.getLocation(username, personIdentifier, positionId)

      expect(result).toEqual([mappedLocation])
      expect(locationsApiClient.getLocation).toHaveBeenCalledWith(username, personIdentifier, positionId)
    })
  })
})
