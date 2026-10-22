import { Dayjs } from 'dayjs'
import type PeopleExclusionApiClient from '../data/peopleExclusionApiClient'
import type {
  ApiRestrictionZone,
  ApiRestrictionZoneResponse,
  RestrictionZonesResult,
} from '../data/peopleExclusionApiClient'

export default class PeopleExclusionService {
  constructor(private readonly peopleExclusionApiClient: PeopleExclusionApiClient) {}

  async getRestrictionZones(
    username: string,
    personId: string,
    fromDate: Dayjs,
    toDate: Dayjs,
    exclusions: boolean = false,
    inclusion: boolean = false,
  ): Promise<RestrictionZonesResult> {
    const response = await this.peopleExclusionApiClient.getRestrictionZones(
      username,
      personId,
      fromDate,
      toDate,
      exclusions,
      inclusion,
    )
    return {
      exclusionZones: this.mapRestrictionZones(response).filter(zone => zone.restrictionType === 'EXCLUSION'),
      inclusionZones: this.mapRestrictionZones(response).filter(zone => zone.restrictionType === 'INCLUSION'),
      nextToken: response.nextToken,
    }
  }

  private mapRestrictionZones(response: ApiRestrictionZoneResponse): ApiRestrictionZone[] {
    const { restrictionZones } = response
    return (restrictionZones ?? []).map(zone => ({
      name: zone.name,
      address: zone.address,
      geometry: zone.geometry,
      restrictionType: zone.restrictionType,
    }))
  }
}
