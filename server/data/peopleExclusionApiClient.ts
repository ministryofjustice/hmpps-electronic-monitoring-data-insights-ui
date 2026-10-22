import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { Dayjs } from 'dayjs'
import config from '../config'
import logger from '../../logger'

export type ApiRestrictionZone = {
  name: string
  address: string
  geometry: Geometry
  restrictionType: 'EXCLUSION' | 'INCLUSION'
}

export type PolygonGeometry = {
  type: 'Polygon'
  crs?: CoordinateReferenceSystem
  coordinates: number[][][]
}

export type PointGeometry = {
  type: 'Point'
  crs?: CoordinateReferenceSystem
  coordinates: number[] 
  radiusMetres: number
}

export type Geometry = PolygonGeometry | PointGeometry

type CoordinateReferenceSystem = {
  type: string
  properties: CoordinateReferenceSystemProperties
}

type CoordinateReferenceSystemProperties = {
  name: string
}

export type ApiRestrictionZoneResponse = {
  restrictionZones: ApiRestrictionZone[]
  nextToken: string | null
}

export type RestrictionZonesResult = {
  exclusionZones: ApiRestrictionZone[]
  inclusionZones: ApiRestrictionZone[]
  nextToken: string | null
}

export default class PeopleExclusionApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('People Exclusion API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getRestrictionZones(
    username: string,
    personId: string,
    fromDate: Dayjs,
    toDate: Dayjs,
    exclusions: boolean = false,
    inclusion: boolean = false,
  ): Promise<ApiRestrictionZoneResponse> {
    return this.get<ApiRestrictionZoneResponse>(
      {
        path: `/people/${personId}/exclusion-zones?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&exclusions=${exclusions}&inclusion=${inclusion}`,
      },
      asSystem(username),
    )
  }
}
