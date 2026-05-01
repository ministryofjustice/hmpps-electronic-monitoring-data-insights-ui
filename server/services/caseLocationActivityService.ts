import { formatDisplayValue } from '../presenters/helpers/formatters'
import GeolocationMechanism from '../types/entities/geolocationMechanism'
import { formatGpsDate } from '../utils/date'
import LocationsService, { type Location } from './locationsService'

export interface CaseLocationBasePosition {
  positionId: number
  latitude: number
  longitude: number
  precision: number | null
  speed: number | null
  direction: number | null
  timestamp: string
  geolocationMechanism: string
  sequenceNumber: number
  deviceId: number | null
  hdop: number | null
  geometry: string | null
  satellite: number | null
  lbs: number | null
  gpsDate: string | null
}

export interface CaseLocationPosition extends CaseLocationBasePosition {
  overlayTitleTemplateId: string
  overlayBodyTemplateId: string
  displayPointNumber: number
  displayGpsDate: string
  displayAccuracy: string
  displayLatitude: string
  displayLongitude: string
}

const getGeolocationMechanism = (value: number | null): GeolocationMechanism | 'Unknown' => {
  const mapping: Record<number, GeolocationMechanism> = {
    1: 'GPS',
    4: 'RF',
    5: 'LBS',
    6: 'WIFI',
  }

  if (value === null) {
    return 'Unknown'
  }

  return mapping[value] || 'Unknown'
}

const hasCoordinates = (location: Location): location is Location & { latitude: number; longitude: number } => {
  return typeof location.latitude === 'number' && typeof location.longitude === 'number'
}

export default class CaseLocationActivityService {
  constructor(private readonly locationsService: LocationsService) {}

  async getPositions(
    username: string,
    personIdentifier: string,
    from: string,
    to: string,
  ): Promise<CaseLocationBasePosition[]> {
    const result = await this.locationsService.getLocations(username, personIdentifier, from, to)

    return result.locations.filter(hasCoordinates).map((location, index) => this.mapLocation(location, index))
  }

  annotatePositionsWithDisplayProperties(positions: Array<CaseLocationBasePosition>): Array<CaseLocationPosition> {
    return positions.map((position, index) => ({
      ...position,
      overlayTitleTemplateId: 'overlay-title-mdss-location',
      overlayBodyTemplateId: 'overlay-body-mdss-location',
      displayPointNumber: index + 1,
      displayGpsDate: formatGpsDate(position.gpsDate) || 'N/A',
      displayAccuracy: formatDisplayValue(position.precision, ' meters', 'N/A'),
      displayLatitude: formatDisplayValue(position.latitude, '', 'N/A'),
      displayLongitude: formatDisplayValue(position.longitude, '', 'N/A'),
    }))
  }

  private mapLocation(
    location: Location & { latitude: number; longitude: number },
    index: number,
  ): CaseLocationBasePosition {
    return {
      positionId: location.id ?? index + 1,
      latitude: location.latitude,
      longitude: location.longitude,
      precision: location.precision,
      speed: location.speed,
      direction: location.direction,
      timestamp: location.gpsDate ?? '',
      geolocationMechanism: getGeolocationMechanism(location.lbs),
      sequenceNumber: index + 1,
      deviceId: location.deviceId,
      hdop: location.hdop,
      geometry: location.geometry,
      satellite: location.satellite,
      lbs: location.lbs,
      gpsDate: location.gpsDate,
    }
  }
}
