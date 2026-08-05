import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiLocation = {
  positionId: number | null
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

export type ApiLocationsResponse = {
  locations: ApiLocation[]
  nextToken: string | null
}

export type GetLocationsOptions = {
  crn?: string
  nextToken?: string
}

export default class LocationsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Locations API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getLocations(
    username: string,
    personIdentifier: string,
    from: string,
    to: string,
    options: GetLocationsOptions = {},
  ): Promise<ApiLocationsResponse> {
    const { crn, nextToken } = options
    return this.get<ApiLocationsResponse>(
      {
        path: `/people/${personIdentifier}/locations`,
        query: {
          from,
          to,
          ...(crn ? { crn } : {}),
          ...(nextToken ? { nextToken } : {}),
        },
      },
      asSystem(username),
    )
  }

  async getLocation(username: string, personIdentifier: string, positionId: string): Promise<ApiLocation[]> {
    return this.get<ApiLocation[]>(
      {
        path: `/people/${personIdentifier}/locations/${positionId}`,
      },
      asSystem(username),
    )
  }
}
