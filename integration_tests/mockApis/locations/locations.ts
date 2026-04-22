import type { SuperAgentRequest } from 'superagent'
import { stubFor } from '../wiremock'

type Location = {
  positionId: number | null
  deviceId: number | null
  gpsDate: string | null
  speed: number | null
  satellite: number | null
  direction: number | null
  precision: number | null
  lbs: number | null
  hdop: number | null
  geometry: string | null
  latitude: number | null
  longitude: number | null
}

export type StubLocations200Options = {
  status: 200
  personId: string
  response: {
    locations: Location[]
    nextToken: string | null
  }
}

const emptyLocation: Location = {
  positionId: null,
  deviceId: null,
  gpsDate: null,
  speed: null,
  satellite: null,
  direction: null,
  precision: null,
  lbs: null,
  hdop: null,
  geometry: null,
  latitude: null,
  longitude: null,
}

const defaultStubLocationsOptions: StubLocations200Options = {
  status: 200,
  personId: '1',
  response: {
    locations: [emptyLocation],
    nextToken: null,
  },
}

const stubLocationsEmpty = (options: StubLocations200Options = defaultStubLocationsOptions): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/people/${options.personId}/locations`,
    },
    response: {
      status: options.status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: options.response,
    },
  })

export default stubLocationsEmpty
