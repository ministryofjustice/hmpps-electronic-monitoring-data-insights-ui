import type ViolationsApiClient from '../data/violationsApiClient'
import type { ApiViolation } from '../data/violationsApiClient'

export type Violation = {
  id: string | null
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

export type ViolationsResult = {
  violations: Violation[]
  nextToken: string | null
}

export default class ViolationsService {
  constructor(private readonly violationsApiClient: ViolationsApiClient) {}

  async getViolations(
    username: string,
    consumerId: string,
    from: string,
    to: string,
    nextToken?: string,
  ): Promise<ViolationsResult> {
    const response = await this.violationsApiClient.getViolations(username, consumerId, from, to, nextToken)

    return {
      violations: response.violations.map(violation => this.mapViolation(violation)),
      nextToken: response.nextToken,
    }
  }

  async getViolation(username: string, consumerId: string, violationId: string): Promise<Violation> {
    const violation = await this.violationsApiClient.getViolation(username, consumerId, violationId)
    return this.mapViolation(violation)
  }

  private mapViolation(violation: ApiViolation): Violation {
    return {
      id: violation.violationId,
      deviceWearer: violation.deviceWearer,
      createdDate: violation.createdDate,
      category: violation.category,
      duration: violation.duration,
      start: violation.start,
      end: violation.end,
      state: violation.state,
      active: violation.active,
      description: violation.description,
      responseAction: violation.responseAction,
      reasonableExcuse: violation.reasonableExcuse,
      authorisedAbsence: violation.authorisedAbsence,
      includedInTotalAtvCalculation: violation.includedInTotalAtvCalculation,
      outForEntireCurfewPeriod: violation.outForEntireCurfewPeriod,
      outcomeReason: violation.outcomeReason,
    }
  }
}
