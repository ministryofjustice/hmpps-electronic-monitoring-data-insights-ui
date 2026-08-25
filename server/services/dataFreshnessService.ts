import type DataFreshnessApiClient from '../data/dataFreshnessApiClient'
import type { ApiDataFreshnessResponse } from '../data/dataFreshnessApiClient'

export default class DataFreshnessService {
  constructor(private readonly dataFreshnessApiClient: DataFreshnessApiClient) {}

  async getDataFreshness(username: string): Promise<ApiDataFreshnessResponse> {
    const { statuses, nextToken } = await this.dataFreshnessApiClient.getDataFreshness(username)
    return {
      statuses,
      nextToken,
    }
  }
}
