import type PeopleExclusionApiClient from '../data/peopleExclusionApiClient'
import type { ApiRestrictionZone } from '../data/peopleExclusionApiClient'

export type ExclusionZonesResult = {
  exclusionZones: ApiRestrictionZone[]
}

export default class PeopleExclusionService {
  constructor(private readonly peopleExclusionApiClient: PeopleExclusionApiClient) {}

  async getExclusionZone(username: string, personId: string, crn: string): Promise<ExclusionZonesResult> {
    const response = await this.peopleExclusionApiClient.getExclusionZone(username, personId, crn)
    return {
      exclusionZones: response.restrictionZones.filter(zone => zone.restrictionType === 'EXCLUSION'),
    }
  }
}
