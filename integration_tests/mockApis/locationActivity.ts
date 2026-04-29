import { stubFor } from './wiremock'
import { Position } from '../../server/services/trailService'

export default {
  stubGetLocations: (
    args: string | { crn?: string; locations?: Position[] } = 'X123456',
    positions: Position[] = [],
  ) => {
    const crn = typeof args === 'string' ? args : (args.crn ?? 'X123456')
    const locations = typeof args === 'string' ? positions : (args.locations ?? [])

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/emdi/people/${crn}/locations.*`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          locations,
          nextToken: null,
        },
      },
    })
  },

  stubGetLocationsEmpty: (args: string | { crn?: string } = {}) => {
    const crn = typeof args === 'string' ? args : (args.crn ?? 'X123456')

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/emdi/people/${crn}/locations.*`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          locations: [],
          nextToken: null,
        },
      },
    })
  },

  stubGetLocationsError: (crn: string = 'X123456') =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/emdi/people/${crn}/locations.*`,
      },
      response: {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          error: 'Internal server error',
        },
      },
    }),
}
