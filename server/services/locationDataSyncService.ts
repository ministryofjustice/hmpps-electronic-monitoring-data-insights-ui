import type LocationDataSyncApiClient from '../data/locationDataSyncApiClient'
import type { ApiLocationDataSyncResponse } from '../data/locationDataSyncApiClient'

export default class LocationDataSyncService {
  constructor(private readonly locationDataSyncApiClient: LocationDataSyncApiClient) {}

  async getLocationDataSyncStatus(username: string): Promise<ApiLocationDataSyncResponse> {
    const { statuses, nextToken } = await this.locationDataSyncApiClient.getLocationDataSyncStatus(username)
    return {
      statuses,
      nextToken,
    }
  }
}
