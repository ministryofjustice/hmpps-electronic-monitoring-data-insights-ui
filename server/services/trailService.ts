import { convertRadiansToDegrees, formatDisplayValue } from '../presenters/helpers/formatters'
import GeolocationMechanism from '../types/entities/geolocationMechanism'
import { formatGpsDate } from '../utils/date'

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
  annotatePositionsWithDisplayProperties(positions: Array<Position>): Array<Position> {
    return positions.map(position => ({
      ...position,

      // Overlay template
      overlayTitleTemplateId: 'overlay-title-mdss-location',
      overlayBodyTemplateId: 'overlay-body-mdss-location',

      // Display values
      displayGpsDate: formatGpsDate(position.timestamp),
      displayAccuracy: formatDisplayValue(position.precision, '', 'N/A'),
      displayTimestamp: formatDisplayValue(position.timestamp, '', 'N/A'),
      displayLatitude: formatDisplayValue(position.latitude, '', 'N/A'),
      displayLongitude: formatDisplayValue(position.longitude, '', 'N/A'),
    }))
  }

  async filterByDate(token: string | undefined, crn: string, filters: Filters): Promise<Position[]> {
    if (!process.env.TRAIL_DATA_BASE_URL) {
      throw new Error('Trail Service - TRAIL_DATA_BASE_URL is not defined in environment variables')
    }

    const { from, to } = filters
    let url = `${process.env.TRAIL_DATA_BASE_URL}/people/${crn}/locations`

    const queryParams: string[] = []

    if (from) {
      const fromDate = from.endsWith('Z') ? new Date(from).toISOString() : new Date(`${from}Z`).toISOString()
      queryParams.push(`from=${fromDate}`)
    }

    if (to) {
      const toDate = to.endsWith('Z') ? new Date(to).toISOString() : new Date(`${to}Z`).toISOString()
      queryParams.push(`to=${toDate}`)
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }
    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) {
        /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
        console.warn(`Trail Service - Network response was not ok: ${response.statusText}`)
        console.warn(`Trail Service - URL: ${url}`)
        console.warn('Trail Service - respsonse:', response)
        throw new Error('Unable to fetch location data. Please try again later.')
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
      throw new Error('Unable to fetch location data. Please try again later.')
    }
  }
}
