import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiFreshnessStatus = {
  code?: string
  description?: string
  latestPosition?: string
}

export type ApiLocationDataSyncResponse = {
  statuses: ApiFreshnessStatus[]
  nextToken: string | null
}

export default class LocationDataSyncApiclient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('DataFreshness API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getLocationDataSyncStatus(username: string): Promise<ApiLocationDataSyncResponse> {
    return this.get<ApiLocationDataSyncResponse>(
      {
        path: `/status`,
      },
      asSystem(username),
    )
  }
}
