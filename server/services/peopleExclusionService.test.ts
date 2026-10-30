import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import PeopleExclusionApiClient, { type ApiExclusionZoneResponse } from '../data/peopleExclusionApiClient'
import PeopleExclusionService from './peopleExclusionService'

describe('PeopleExclusionService', () => {
  it('forwards the CRN to the API client and preserves zone geometry and pagination', async () => {
    const client = new PeopleExclusionApiClient({} as AuthenticationClient)
    const response: ApiExclusionZoneResponse = {
      exclusionZones: [
        {
          name: 'Zone A',
          address: '1 Test Street',
          geometry: {
            type: 'Polygon',
            crs: { type: 'name', properties: { name: 'EPSG:4326' } },
            coordinates: [
              [
                [-0.1, 51.5],
                [-0.1, 51.51],
                [-0.09, 51.51],
                [-0.1, 51.5],
              ],
            ],
          },
        },
      ],
      nextToken: 'next-page',
    }
    const getZone = jest.spyOn(client, 'getExclusionZone').mockResolvedValue(response)

    const result = await new PeopleExclusionService(client).getExclusionZone('user1', '41591', 'X31092')

    expect(getZone).toHaveBeenCalledWith('user1', '41591', 'X31092')
    expect(result).toEqual(response)
  })
})
