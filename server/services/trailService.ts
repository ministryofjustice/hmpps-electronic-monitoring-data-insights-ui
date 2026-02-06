import GeolocationMechanism from '../types/entities/geolocationMechanism'

export interface Position {
  positionId: number
  latitude: number
  longitude: number
  precision: number
  speed: number
  direction: number
  timestamp: string
  geolocationMechanism: string
  sequenceNumber: number
  deviceId?: string
  hdop?: number
  geometry?: string
  satellite?: number
  lbs?: number
}

export interface PositionData {
  locations: Position[]
}
export interface Filters {
  from?: string
  to?: string
}

const getGeolocationMechanism = (value: number): GeolocationMechanism | undefined => {
  const mapping: Record<number, GeolocationMechanism> = {
    1: 'GPS',
    4: 'RF',
    5: 'LBS',
    6: 'WIFI',
  }
  return mapping[value]
}

export default class TrailService {
  private cache: PositionData | null = null

  private readonly rowsPath: string

  async filterByDate(crn: string, filters: Filters): Promise<Position[]> {
    if (!process.env.TRAIL_DATA_BASE_URL) {
      throw new Error('Trail Service - TRAIL_DATA_BASE_URL is not defined in environment variables')
    }

    const { from, to } = filters
    let url = `${process.env.TRAIL_DATA_BASE_URL}/people/${crn}/locations`

    const queryParams: string[] = []

    if (from) {
      const fromDate = new Date(from).toISOString()
      queryParams.push(`from=${fromDate}`)
    }

    if (to) {
      const toDate = new Date(to).toISOString()
      queryParams.push(`to=${toDate}`)
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }

    try {
      const response = await fetch(url)

      if (!response.ok) {
        /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
        console.warn(`Trail Service - Network response was not ok: ${response.statusText}`)
        return []
      }

      const data: PositionData = await response.json()
      return data.locations.map(location => {
        const { lbs, deviceId, hdop, geometry, satellite, ...cleanedLocation } = location
        if (typeof lbs === 'number') {
          cleanedLocation.geolocationMechanism = getGeolocationMechanism(lbs) || 'Unknown'
        }
        return cleanedLocation
      })
    } catch (error) {
      console.error('Trail Service - There was a problem with the fetch operation:', error)
      return []
    }
  }
}
