import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PeopleExclusionApiClient, { type ApiExclusionZoneResponse } from './peopleExclusionApiClient'

describe('PeopleExclusionApiClient', () => {
  it('includes the required CRN query parameter while retaining the person ID in the path', async () => {
    const client = new PeopleExclusionApiClient({} as AuthenticationClient)
    const response: ApiExclusionZoneResponse = { exclusionZones: [], nextToken: null }
    const getSpy = jest.spyOn(client, 'get').mockResolvedValue(response)

    const result = await client.getExclusionZone('user1', '41591', 'X31092')

    expect(getSpy).toHaveBeenCalledWith(
      { path: '/people/41591/exclusion-zones', query: { crn: 'X31092' } },
      asSystem('user1'),
    )
    expect(result).toEqual(response)
  })
})
