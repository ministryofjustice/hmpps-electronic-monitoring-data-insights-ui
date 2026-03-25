import type { SuperAgentRequest } from 'superagent'
import { stubFor } from '../wiremock'

type Violation = {
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

export type StubViolation200Options = {
  status: 200
  consumerId: string
  violationId: string
  response: Violation
}

const emptyViolation: Violation = {
  violationId: null,
  deviceWearer: null,
  createdDate: null,
  category: null,
  duration: null,
  start: null,
  end: null,
  state: null,
  active: null,
  description: null,
  responseAction: null,
  reasonableExcuse: null,
  authorisedAbsence: null,
  includedInTotalAtvCalculation: null,
  outForEntireCurfewPeriod: null,
  outcomeReason: null,
}

const defaultStubViolationOptions: StubViolation200Options = {
  status: 200,
  consumerId: '1',
  violationId: '1',
  response: emptyViolation,
}

const stubViolationEmpty = (options: StubViolation200Options = defaultStubViolationOptions): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/people/${options.consumerId}/curfew/violations/${options.violationId}`,
    },
    response: {
      status: options.status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: options.response,
    },
  })

export default stubViolationEmpty
