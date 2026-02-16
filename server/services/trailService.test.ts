import TrailService, { Filters, Position } from './trailService'

describe.skip('TrailService', () => {
  let trailService: TrailService
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, TRAIL_DATA_BASE_URL: 'http://api.test.com' }
    trailService = new TrailService()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.clearAllMocks()
  })

  describe('filterByDate', () => {
    const crn = 'X123456'
    const mockLocations = [
      {
        positionId: 1,
        latitude: 51.5,
        longitude: -0.1,
        lbs: 1, // Should map to GPS geolocationMechanism
        deviceId: 'dev-123',
      },
    ]

    it('should throw an error if TRAIL_DATA_BASE_URL is missing', async () => {
      delete process.env.TRAIL_DATA_BASE_URL
      await expect(trailService.filterByDate(undefined, crn, {})).rejects.toThrow(
        'Trail Service - TRAIL_DATA_BASE_URL is not defined',
      )
    })

    it('should fetch and return filtered positions', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locations: mockLocations }),
      })

      const filters: Filters = { from: '2025-12-01T00:00:00Z', to: '2025-12-31T23:59:59Z' }
      const positions = await trailService.filterByDate('token-1', crn, filters)

      expect(fetch).toHaveBeenCalledWith(
        'http://api.test.com/people/X123456/locations?from=2025-12-01T00:00:00.000Z&to=2025-12-31T23:59:59.000Z',
        { headers: { Authorization: 'Bearer token-1' } },
      )
      expect(positions).toEqual([
        {
          positionId: 1,
          latitude: 51.5,
          longitude: -0.1,
          geolocationMechanism: 'GPS',
        },
      ])
    })

    it('should correctly format UTC ISO dates in query parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ locations: [] as Position[] }),
      })

      const filters: Filters = { from: '2026-10-01 10:00', to: '2026-10-01 11:00' }
      await trailService.filterByDate(undefined, crn, filters)

      const expectedUrl =
        'http://api.test.com/people/X123456/locations?from=2026-10-01T09:00:00.000Z&to=2026-10-01T10:00:00.000Z'
      expect(global.fetch).toHaveBeenCalledWith(expectedUrl, { headers: undefined })
    })

    it.skip('should handle fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
      const filters: Filters = { from: '2025-12-01T00:00:00Z', to: '2025-12-31T23:59:59Z' }
      const positions = await trailService.filterByDate(undefined, crn, filters)
      expect(positions).toEqual([])
    })
  })
})
