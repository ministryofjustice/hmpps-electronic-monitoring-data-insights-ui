import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiFreshnessStatus = {
  code?: string
  description?: string
  latestPosition?: string
}

export type ApiFreshnessStatusesponse = {
  statuses: ApiFreshnessStatus[]
  nextToken: string | null
}

export default class DataFreshnessApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('DataFreshness API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getDataFreshness(username: string, personId: string): Promise<ApiFreshnessStatusesponse> {
    return this.get<ApiFreshnessStatusesponse>(
      {
        path: `/status`,
      },
      asSystem(username),
    )
  }
}
