import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import ViolationsApiClient from './violationsApiClient'

describe('ViolationsApiClient integration', () => {
  const authenticationClient = {} as AuthenticationClient
  const token = 'user-token'
  const consumerId = '9b74b1071beb2210743d8551f54bcbcc'
  const violationId = 'ATV-123'
  const from = '2026-03-24T00:00:00Z'
  const to = '2026-03-25T00:00:00Z'
  const nextToken = 'next-page-token'

  let violationsApiClient: ViolationsApiClient

  beforeEach(() => {
    violationsApiClient = new ViolationsApiClient(authenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('gets violations by consumerId and date range against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get(`/people/${consumerId}/curfew/violations`)
      .query({ from, to, nextToken })
      .reply(200, {
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
      })

    const result = await violationsApiClient.getViolations(token, consumerId, from, to, nextToken)

    expect(result).toEqual({
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
    })
    expect(nock.isDone()).toBe(true)
  })

  it('gets a single violation by consumerId and violationId against the EMDI API', async () => {
    nock(config.apis.emdiApi.url, {
      reqheaders: { authorization: `Bearer ${token}` },
    })
      .get(`/people/${consumerId}/curfew/violations/${violationId}`)
      .reply(200, {
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
      })

    const result = await violationsApiClient.getViolation(token, consumerId, violationId)

    expect(result).toEqual({
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
    })
    expect(nock.isDone()).toBe(true)
  })
})
