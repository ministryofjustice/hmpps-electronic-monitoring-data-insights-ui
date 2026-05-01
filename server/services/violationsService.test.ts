import ViolationsService, { type Violation, type ViolationsResult } from './violationsService'
import type ViolationsApiClient from '../data/violationsApiClient'
import type { ApiViolation } from '../data/violationsApiClient'

describe('ViolationsService', () => {
  const username = 'user1'
  const consumerId = '9b74b1071beb2210743d8551f54bcbcc'
  const violationId = 'ATV-123'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let violationsApiClient: jest.Mocked<ViolationsApiClient>
  let violationsService: ViolationsService

  const apiViolation: ApiViolation = {
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
  }

  const mappedViolation: Violation = {
    id: 'ATV-123',
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
  }

  beforeEach(() => {
    violationsApiClient = {
      getViolations: jest.fn(),
      getViolation: jest.fn(),
    } as unknown as jest.Mocked<ViolationsApiClient>

    violationsService = new ViolationsService(violationsApiClient)
  })

  describe('getViolations', () => {
    it('maps the API violations response into domain violations', async () => {
      violationsApiClient.getViolations.mockResolvedValue({
        violations: [apiViolation],
        nextToken,
      })

      const result = await violationsService.getViolations(username, consumerId, from, to, nextToken)

      expect(result).toEqual<ViolationsResult>({
        violations: [mappedViolation],
        nextToken,
      })
      expect(violationsApiClient.getViolations).toHaveBeenCalledWith(username, consumerId, from, to, nextToken)
    })
  })

  describe('getViolation', () => {
    it('maps the API single violation response into a domain violation', async () => {
      violationsApiClient.getViolation.mockResolvedValue(apiViolation)

      const result = await violationsService.getViolation(username, consumerId, violationId)

      expect(result).toEqual(mappedViolation)
      expect(violationsApiClient.getViolation).toHaveBeenCalledWith(username, consumerId, violationId)
    })
  })
})
