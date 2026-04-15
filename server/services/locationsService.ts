import type LocationsApiClient from '../data/locationsApiClient'
import type { ApiLocation } from '../data/locationsApiClient'

export type Location = {
  id: number | null
  deviceId: number | null
  gpsDate: string | null
  speed: number | null
  satellite: number | null
  direction: number | null
  precision: number | null
  lbs: number | null
  hdop: number | null
  geometry: string | null
  latitude: number | null
  longitude: number | null
}

export type LocationsResult = {
  locations: Location[]
  nextToken: string | null
}

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  async getLocations(
    token: string,
    personId: string,
    from: string,
    to: string,
    nextToken?: string,
  ): Promise<LocationsResult> {
    const response = await this.locationsApiClient.getLocations(token, personId, from, to, nextToken)

    return {
      locations: response.locations.map(location => this.mapLocation(location)),
      nextToken: response.nextToken,
    }
  }

  async getLocation(token: string, personId: string, positionId: string): Promise<Location[]> {
    const locations = await this.locationsApiClient.getLocation(token, personId, positionId)
    return locations.map(location => this.mapLocation(location))
  }

  private mapLocation(location: ApiLocation): Location {
    return {
      id: location.positionId,
      deviceId: location.deviceId,
      gpsDate: location.gpsDate,
      speed: location.speed,
      satellite: location.satellite,
      direction: location.direction,
      precision: location.precision,
      lbs: location.lbs,
      hdop: location.hdop,
      geometry: location.geometry,
      latitude: location.latitude,
      longitude: location.longitude,
    }
  }
}
