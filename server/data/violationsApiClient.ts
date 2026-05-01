import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiViolation = {
  violationId: string | null
  deviceWearer: string | null
  createdDate: string | null
  category: string | null
  duration: string | null
  start: string | null
  end: string | null
  state: string | null
  active: string | null
  description: string | null
  responseAction: string | null
  reasonableExcuse: string | null
  authorisedAbsence: string | null
  includedInTotalAtvCalculation: string | null
  outForEntireCurfewPeriod: string | null
  outcomeReason: string | null
}

export type ApiViolationsResponse = {
  violations: ApiViolation[]
  nextToken: string | null
}

export default class ViolationsApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Violations API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getViolations(
    username: string,
    consumerId: string,
    from: string,
    to: string,
    nextToken?: string,
  ): Promise<ApiViolationsResponse> {
    return this.get<ApiViolationsResponse>(
      {
        path: `/people/${consumerId}/curfew/violations`,
        query: {
          from,
          to,
          ...(nextToken ? { nextToken } : {}),
        },
      },
      asSystem(username),
    )
  }

  async getViolation(username: string, consumerId: string, violationId: string): Promise<ApiViolation> {
    return this.get<ApiViolation>(
      {
        path: `/people/${consumerId}/curfew/violations/${violationId}`,
      },
      asSystem(username),
    )
  }
}
