import { ApiDataFreshnessResponse } from "../../../data/dataFreshnessApiClient"

export const getMockDataOutOfSync = async (): Promise<ApiDataFreshnessResponse> => {
  const nextToken = ""
  const latestPosition = new Date(Date.now() - 30 * 60 * 1000)
    .toISOString()
    .split('.')[0] + 'Z'
    console.log('>>> xxx Returning mock data freshness error with latestPosition:', latestPosition, 'nextToken:', nextToken)
  return {
    statuses: [
      {
        code: "DATA_OUT_OF_SYNC",
        description: "Data out of sync",
        latestPosition,
      },
    ],
    nextToken,
  }
}