import { stubFor } from './wiremock'
import { Position } from '../../server/services/trailService'

export default {
  stubGetLocations: (crn: string = 'X123456', positions: Position[] = []) =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/people/${crn}/locations.*`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          locations: positions,
        },
      },
    }),

  stubGetLocationsEmpty: (args: { crn?: string } = {}) => {
    const { crn = 'X123456' } = args

    return stubFor({
      request: {
        method: 'GET',
        urlPathPattern: `/people/${crn}/locations`,
        queryParameters: {
          from: {
            matches: '.*',
          },
          to: {
            matches: '.*',
          },
        },
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          locations: [],
        },
      },
    })
  },

  stubGetLocationsError: (crn: string = 'X123456') =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: `/people/${crn}/locations?from=.*`,
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
