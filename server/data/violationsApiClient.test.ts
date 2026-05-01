import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import ViolationsApiClient, { type ApiViolation, type ApiViolationsResponse } from './violationsApiClient'

describe('ViolationsApiClient', () => {
  const authenticationClient = {} as AuthenticationClient
  const username = 'user1'
  const consumerId = '9b74b1071beb2210743d8551f54bcbcc'
  const violationId = 'ATV-123'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let violationsApiClient: ViolationsApiClient

  const violationsResponse: ApiViolationsResponse = {
    violations: [
      {
        violationId: 'ATV-123',
        deviceWearer: 'DEVWR0004718',
        createdDate: '2026-03-24T12:00:00Z',
        category: 'Curfew breach',
        duration: 'PT30M',
        start: '2026-03-24T11:30:00Z',
        end: '2026-03-24T12:00:00Z',
        state: 'OPEN',
        active: 'true',
        description: 'Returned after curfew start',
        responseAction: 'Review',
        reasonableExcuse: 'false',
        authorisedAbsence: 'false',
        includedInTotalAtvCalculation: 'true',
        outForEntireCurfewPeriod: 'false',
        outcomeReason: 'Pending review',
      },
    ],
    nextToken: null,
  }

  const violationResponse: ApiViolation = violationsResponse.violations[0]

  beforeEach(() => {
    violationsApiClient = new ViolationsApiClient(authenticationClient)
  })

  describe('getViolations', () => {
    it('calls the violations endpoint with consumerId and date range using the system token for the username', async () => {
      const getSpy = jest.spyOn(violationsApiClient, 'get').mockResolvedValue(violationsResponse)

      const result = await violationsApiClient.getViolations(username, consumerId, from, to)

      expect(result).toEqual(violationsResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${consumerId}/curfew/violations`,
          query: { from, to },
        },
        asSystem(username),
      )
    })

    it('includes nextToken when provided', async () => {
      const getSpy = jest.spyOn(violationsApiClient, 'get').mockResolvedValue(violationsResponse)

      await violationsApiClient.getViolations(username, consumerId, from, to, nextToken)

      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${consumerId}/curfew/violations`,
          query: { from, to, nextToken },
        },
        asSystem(username),
      )
    })
  })

  describe('getViolation', () => {
    it('calls the single violation endpoint with consumerId and violationId using the system token for the username', async () => {
      const getSpy = jest.spyOn(violationsApiClient, 'get').mockResolvedValue(violationResponse)

      const result = await violationsApiClient.getViolation(username, consumerId, violationId)

      expect(result).toEqual(violationResponse)
      expect(getSpy).toHaveBeenCalledWith(
        {
          path: `/people/${consumerId}/curfew/violations/${violationId}`,
        },
        asSystem(username),
      )
    })
  })
})
