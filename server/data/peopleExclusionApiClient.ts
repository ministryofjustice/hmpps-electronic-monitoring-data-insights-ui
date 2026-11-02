import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiExclusionZone = {
  name: string
  address: string
  geometry: Geometry
}

export type Geometry =
  | { type: 'Polygon'; crs?: CoordinateReferenceSystem; coordinates: number[][][] }
  | { type: 'Point'; crs?: CoordinateReferenceSystem; coordinates: number[]; radiusMetres: number }

export type ApiRestrictionZone = ApiExclusionZone & {
  restrictionZoneId: number
  restrictionType: 'EXCLUSION' | 'INCLUSION'
  schedule: {
    scheduleType: string
    activeFrom: string
    activeTo: string
    applicableFrom: string
    applicableTo: string
    recurrence?: {
      weekFrequency: number
      daysOfWeek: string[]
    }
  }
}

type CoordinateReferenceSystem = {
  type: string
  properties: CoordinateReferenceSystemProperties
}

type CoordinateReferenceSystemProperties = {
  name: string
}

export type ApiRestrictionZoneResponse = {
  restrictionZones: ApiRestrictionZone[]
}

export default class PeopleExclusionApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('People Exclusion API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getExclusionZone(username: string, personId: string, crn: string): Promise<ApiRestrictionZoneResponse> {
    return this.get<ApiRestrictionZoneResponse>(
      {
        path: `/people/${personId}/restrictions`,
        query: { crn },
      },
      asSystem(username),
    )
  }
}
