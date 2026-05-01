import CaseLocationActivityService from './caseLocationActivityService'
import LocationsService from './locationsService'

describe('CaseLocationActivityService', () => {
  let locationsService: jest.Mocked<LocationsService>
  let caseLocationActivityService: CaseLocationActivityService

  beforeEach(() => {
    locationsService = {
      getLocations: jest.fn(),
    } as unknown as jest.Mocked<LocationsService>

    caseLocationActivityService = new CaseLocationActivityService(locationsService)
  })

  it('maps API locations into base case positions', async () => {
    locationsService.getLocations.mockResolvedValue({
      locations: [
        {
          id: 12,
          deviceId: 34,
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

    const result = await caseLocationActivityService.getPositions(
      'user1',
      'X172591',
      '2026-03-24T00:00:00Z',
      '2026-03-25T00:00:00Z',
    )

    expect(result).toEqual([
      expect.objectContaining({
        positionId: 12,
        latitude: 53.578,
        longitude: -2.429,
        timestamp: '2026-03-24T12:00:00Z',
        geolocationMechanism: 'GPS',
        sequenceNumber: 1,
      }),
    ])
  })

  it('annotates positions with ping card display fields', () => {
    const result = caseLocationActivityService.annotatePositionsWithDisplayProperties([
      {
        positionId: 1,
        latitude: 51.5,
        longitude: -0.1,
        precision: null,
        speed: null,
        direction: null,
        timestamp: '',
        geolocationMechanism: 'Unknown',
        sequenceNumber: 1,
        deviceId: null,
        hdop: null,
        geometry: null,
        satellite: null,
        lbs: null,
        gpsDate: null,
      },
    ])

    expect(result[0]).toEqual(
      expect.objectContaining({
        displayPointNumber: 1,
        displayGpsDate: 'N/A',
        displayAccuracy: 'N/A',
        displayLatitude: '51.5',
        displayLongitude: '-0.1',
      }),
    )
  })

  it('filters out locations without coordinates', async () => {
    locationsService.getLocations.mockResolvedValue({
      locations: [
        {
          id: null,
          deviceId: null,
          gpsDate: null,
          speed: null,
          satellite: null,
          direction: null,
          precision: null,
          lbs: null,
          hdop: null,
          geometry: null,
          latitude: null,
          longitude: null,
        },
        {
          id: null,
          deviceId: null,
          gpsDate: null,
          speed: null,
          satellite: null,
          direction: null,
          precision: null,
          lbs: null,
          hdop: null,
          geometry: null,
          latitude: 51.5,
          longitude: -0.1,
        },
      ],
      nextToken: null,
    })

    const result = await caseLocationActivityService.getPositions(
      'user1',
      'X172591',
      '2026-03-24T00:00:00Z',
      '2026-03-25T00:00:00Z',
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(
      expect.objectContaining({
        positionId: 1,
        latitude: 51.5,
        longitude: -0.1,
      }),
    )
  })
})
